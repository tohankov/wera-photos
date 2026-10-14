// Upload section (category) images to Horoshop through the horoshop MCP server.
//
// Talks MCP over stdio to the same server Claude Code uses (config from ~/.claude.json),
// and changes ONLY the category cover image. Every write is followed by a re-read that is
// compared with the backup; any difference outside the image field stops the run.
//
// Usage:
//   node upload_category_images.js backup               # read all matched sections -> backup/categories_before.json
//   node upload_category_images.js dry   ID [ID ...]    # dry-run upload + field plan, no writes
//   node upload_category_images.js apply ID [ID ...]    # upload + verify, stop on any foreign change
//   node upload_category_images.js apply --rest         # every matched section not yet done
//
// Input: backup/match.json ({matched:[{path,file,id,parent}]}) built from category_images.xlsx.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = __dirname;
const STORE = 'tlshop';
const IMG_DIR = path.join(ROOT, 'category_images', 'B');
const BACKUP_DIR = path.join(ROOT, 'backup');
const MATCH = path.join(BACKUP_DIR, 'match.json');
const BEFORE = path.join(BACKUP_DIR, 'categories_before.json');
const EXPORT_BEFORE = path.join(BACKUP_DIR, 'pages_export_before.json');
const LOG = path.join(BACKUP_DIR, 'upload_log.jsonl');
const PAUSE_MS = 1500;

// The cover lives in extra_parent[image][...] (custom template) or extra[image][...] (default).
const IMAGE_FIELD = /^extra(_parent)?\[image\]\[(value|id)\]$/;

// ---------- MCP stdio client ----------
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')).mcpServers.horoshop;
const child = spawn(cfg.command, cfg.args, { env: { ...process.env, ...cfg.env } });
let buf = '';
const pending = new Map();
let nextId = 1;
child.stdout.on('data', d => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});
child.stderr.on('data', () => {});

function rpc(method, params) {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return new Promise((res, rej) => {
    const t = setTimeout(() => { pending.delete(id); rej(new Error(`timeout: ${method} ${params?.name ?? ''}`)); }, 180000);
    pending.set(id, m => { clearTimeout(t); res(m); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const CALL_GAP_MS = 400;
const RETRY_WAITS_MS = [15000, 30000, 60000, 120000, 240000];
let lastCall = 0;

// Calls are spaced out; an HTTP 429 (store rate limit) is retried with a growing pause.
// Uploads are never retried here: a 429 on a write is reported as an error instead.
async function tool(name, args) {
  for (let attempt = 0; ; attempt++) {
    const gap = lastCall + CALL_GAP_MS - Date.now();
    if (gap > 0) await sleep(gap);
    lastCall = Date.now();
    const m = await rpc('tools/call', { name, arguments: { store: STORE, ...args } });
    if (m.error) throw new Error(`${name}: ${JSON.stringify(m.error)}`);
    const text = (m.result.content || []).map(c => c.text).join('\n');
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!m.result.isError) return data;
    const limited = /HTTP 429|Rate Limited/i.test(text);
    const isWrite = name === 'horoshop_admin_upload_image' && args.dryRun === false;
    if (limited && !isWrite && attempt < RETRY_WAITS_MS.length) {
      console.log(`rate limited on ${name}, waiting ${RETRY_WAITS_MS[attempt] / 1000}s`);
      await sleep(RETRY_WAITS_MS[attempt]);
      continue;
    }
    const e = new Error(`${name} failed: ${text.slice(0, 500)}`);
    e.data = data;
    throw e;
  }
}

// ---------- reading a section ----------
async function treeEntry(id, parent) {
  const r = await tool('horoshop_pages_export', { parent, allowLarge: true });
  const p = r.response.pages.find(x => String(x.id) === String(id));
  return p ? { id: p.id, parent: p.parent, title: p.title, discount: p.discount, image: p.image } : null;
}

// `tree` may be passed in (backup reads it from the saved full export instead of one call per section).
async function snapshot(id, parent, tree) {
  const page = await tool('horoshop_admin_page_get', { id, allowLarge: true });
  const rec = await tool('horoshop_admin_record_get', { entity: 'pages', id, allowLarge: true });
  const selects = {};
  for (const [k, v] of Object.entries(rec.selects || {})) selects[k] = v.value; // values only, option lists dropped
  return {
    id,
    page,
    record: { fieldCount: rec.fieldCount, fields: rec.fields, selects, checkboxFields: rec.checkboxFields, fileFields: rec.fileFields, hidden: rec.hidden },
    tree: tree ?? await treeEntry(id, parent),
  };
}

function flatten(o, prefix = '', out = {}) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(o)) {
    out[prefix] = JSON.stringify(o);
  } else out[prefix] = o;
  return out;
}

// Diff two snapshots; returns [{key, from, to, image}] where `image` marks the cover field.
function diff(a, b) {
  const fa = flatten({ page: a.page, record: a.record, tree: a.tree });
  const fb = flatten({ page: b.page, record: b.record, tree: b.tree });
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  const out = [];
  for (const k of keys) {
    if (fa[k] === fb[k]) continue;
    const field = k.replace(/^record\.(fields|hidden)\./, '');
    const image = IMAGE_FIELD.test(field) || k === 'tree.image';
    out.push({ key: k, from: fa[k] ?? null, to: fb[k] ?? null, image });
  }
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

function loadMatch() { return JSON.parse(fs.readFileSync(MATCH, 'utf8')).matched; }
function loadBefore() { return JSON.parse(fs.readFileSync(BEFORE, 'utf8')); }
function imageBase64(file) { return fs.readFileSync(path.join(IMG_DIR, file)).toString('base64'); }
function log(entry) { fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n'); }
function doneIds() {
  if (!fs.existsSync(LOG)) return new Set();
  return new Set(fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(e => e.status === 'ok').map(e => String(e.id)));
}

// ---------- commands ----------
async function cmdBackup() {
  const matched = loadMatch();
  for (const m of matched) {
    if (!fs.existsSync(path.join(IMG_DIR, m.file))) throw new Error(`missing image file: ${m.file}`);
  }
  if (fs.existsSync(BEFORE)) throw new Error(`${BEFORE} already exists — refusing to overwrite the backup`);
  // Tree data (parent, titles, discount, current image) comes from the full export saved before any change.
  const exportPages = JSON.parse(fs.readFileSync(EXPORT_BEFORE, 'utf8')).response.pages;
  const treeById = new Map(exportPages.map(p => [String(p.id), { id: p.id, parent: p.parent, title: p.title, discount: p.discount, image: p.image }]));
  const partial = BEFORE + '.partial';
  const out = fs.existsSync(partial)
    ? JSON.parse(fs.readFileSync(partial, 'utf8'))
    : { takenAt: new Date().toISOString(), store: STORE, sections: {} };
  let n = Object.keys(out.sections).length;
  for (const m of matched) {
    if (out.sections[m.id]) continue;
    out.sections[m.id] = { path: m.path, file: m.file, ...(await snapshot(m.id, m.parent, treeById.get(String(m.id)))) };
    fs.writeFileSync(partial, JSON.stringify(out));
    if (++n % 20 === 0) console.log(`backup ${n}/${matched.length}`);
  }
  fs.writeFileSync(BEFORE, JSON.stringify(out, null, 2));
  fs.unlinkSync(partial);
  console.log(`backup written: ${BEFORE} (${n} sections)`);
}

function sectionsFor(ids) {
  const byId = new Map(loadMatch().map(m => [String(m.id), m]));
  return ids.map(id => { const m = byId.get(String(id)); if (!m) throw new Error(`id ${id} not in match.json`); return m; });
}

async function cmdDry(ids) {
  const before = loadBefore().sections;
  for (const m of sectionsFor(ids)) {
    const b = before[m.id];
    const r = await tool('horoshop_admin_upload_image', {
      target: 'category_cover', id: m.id, base64: imageBase64(m.file), filename: m.file, dryRun: true,
    });
    // The dry run changes nothing; re-read to prove the section still matches the backup.
    const now = await snapshot(m.id, m.parent);
    console.log(JSON.stringify({ id: m.id, path: m.path, file: m.file, dryRun: r, driftSinceBackup: diff(b, now) }, null, 2));
  }
}

async function cmdApply(ids) {
  const before = loadBefore().sections;
  const done = doneIds();
  const list = sectionsFor(ids).filter(m => !done.has(String(m.id)));
  console.log(`to apply: ${list.length}`);
  let ok = 0;
  for (const [i, m] of list.entries()) {
    const b = before[m.id];
    // Refuse to write if the section drifted since the backup (someone edited it meanwhile).
    const pre = await snapshot(m.id, m.parent);
    const drift = diff(b, pre).filter(d => !d.image);
    if (drift.length) {
      log({ id: m.id, path: m.path, status: 'stopped-drift', drift });
      console.log(JSON.stringify({ STOP: 'section changed since backup, not written', id: m.id, path: m.path, drift }, null, 2));
      return finish(ok, list.length, 1);
    }
    let r;
    try {
      r = await tool('horoshop_admin_upload_image', {
        target: 'category_cover', id: m.id, base64: imageBase64(m.file), filename: m.file, dryRun: false,
      });
    } catch (e) {
      log({ id: m.id, path: m.path, status: 'error', error: e.message });
      console.log(JSON.stringify({ ERROR: e.message, id: m.id, path: m.path }));
      await sleep(PAUSE_MS);
      continue;
    }
    const after = await snapshot(m.id, m.parent);
    const changes = diff(b, after);
    const foreign = changes.filter(d => !d.image);
    const imageChanged = changes.some(d => d.image);
    const status = foreign.length ? 'stopped-foreign-change' : imageChanged ? 'ok' : 'error-image-unchanged';
    log({ id: m.id, path: m.path, file: m.file, status, changes, upload: r });
    console.log(JSON.stringify({ n: `${i + 1}/${list.length}`, id: m.id, path: m.path, status, changes }, null, 2));
    if (foreign.length) return finish(ok, list.length, 1);
    if (status === 'ok') ok++;
    await sleep(PAUSE_MS);
  }
  return finish(ok, list.length, 0);
}

function finish(ok, total, code) {
  console.log(`done: ok=${ok} of ${total}${code ? ' — STOPPED' : ''}`);
  return code;
}

(async () => {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'upload_category_images', version: '1' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const [cmd, ...rest] = process.argv.slice(2);
  let code = 0;
  if (cmd === 'backup') await cmdBackup();
  else if (cmd === 'dry') await cmdDry(rest);
  else if (cmd === 'apply') code = await cmdApply(rest[0] === '--rest' ? loadMatch().map(m => m.id) : rest);
  else { console.error('usage: backup | dry ID... | apply ID... | apply --rest'); code = 2; }
  child.kill();
  process.exit(code);
})().catch(e => { console.error('FATAL', e.message); child.kill(); process.exit(1); });
