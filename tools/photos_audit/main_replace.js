// Global check item 7 (owner 24.10.2026): replace the MAIN photo of a product by its cut-out (photos_audit/global_cut.js), in the SAME gallery slot
// (order and the other photos untouched), via horoshop_admin_upload_image (a form save — CLAUDE.md: parent / alt_parent checked by export before / after).
//   node photos_audit/main_replace.js <work dir> <list.json [articles]> [budget s=520]   (resumable: <work>/replace_state.json)
// Per product: export before (backup/global_photo_<art>_before.json) + every gallery photo downloaded (backup/global_photo_orig/<art>/NN.ext) ->
// slot = the first file field of the form -> upload -> export after: images[0] is a NEW file, images[1..] identical, every other field identical,
// else STOP (a wrong slot is put back from the backup bytes) -> the new main photo is fetched from the storefront: PNG with transparent corners.
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const S = require('../lib/session.js').open();
const [, , WORK, LIST, B] = process.argv; const T0 = Date.now(), BUD = (+B || 520) * 1000; const sleep = ms => new Promise(r => setTimeout(r, ms));
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', ORIG = BK + 'global_photo_orig/'; const SF = path.join(WORK, 'replace_state.json');
const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}; const save = () => fs.writeFileSync(SF, JSON.stringify(st, null, 1));
const call = async (t, a) => { for (let k = 0; k < 20; k++) { await sleep(1500); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { console.log('429, wait', +m[1] + 5); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { save(); console.log('STOP', m); S.close(); process.exit(2); };
const F = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics', 'icons',
  'short_description', 'seo_title', 'seo_description', 'slug', 'brand', 'wholesale_prices', 'bind_accessories', 'bind_accessories_categories', 'bind_gifts', 'bind_gifts_categories'];
// the form save drops values of multi-select characteristics (24.10.2026, 05018264001: «Шестигранний стрижень» of two «Особливості викрутки») and may cut
// alt_parent (CLAUDE.md) — both are put back by catalog_import from the export before (dryRun: only those keys), then checked by export again
async function restore(a, before, after) { const chars = {}; for (const k of new Set([...Object.keys(before.characteristics || {}), ...Object.keys(after.characteristics || {})]))
    if (JSON.stringify((before.characteristics || {})[k]) !== JSON.stringify((after.characteristics || {})[k])) chars[k] = ((before.characteristics || {})[k] || []).map(x => x.value.ua);
  const p = { article: a }; if (Object.keys(chars).length) p.characteristics = chars; const altBad = JSON.stringify(before.alt_parent) !== JSON.stringify(after.alt_parent); if (altBad) p.alt_parent = (before.alt_parent || []).map(x => ({ id: x.id }));
  const TMP = path.join(__dirname, `../fix/photo_restore_${a}.json`); fs.writeFileSync(TMP, JSON.stringify({ products: [p] }));
  const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const off = (dry.willChange || []).flatMap(w => Object.keys(w.changes || {}).filter(f => !/^characteristics/.test(f) && !(altBad && f === 'alt_parent')));
  if (off.length || (dry.characteristics || []).some(c => Object.keys(c.write || {}).some(k => !(k in chars)))) stop(`${a}: restore dryRun outside plan ${JSON.stringify(off)}`);
  const w = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((w.errors || []).length) stop(`${a}: restore errors ${JSON.stringify(w.errors).slice(0, 200)}`); fs.unlinkSync(TMP);
  return { chars: Object.keys(chars), alt: altBad }; }
const exp = async a => { const r = await call('horoshop_catalog_export', { expr: { article: [a] }, includedParams: F, limit: 5, allowLarge: true }); const p = ((r.response || {}).products || [])[0]; if (!p) stop('export ' + a + ' ' + JSON.stringify(r).slice(0, 200)); return p; };
const fname = u => u.split('/').pop();
(async () => { const list = JSON.parse(fs.readFileSync(LIST, 'utf8'));
  for (const a of list) { if (st[a] && st[a].done) continue; if (Date.now() - T0 > BUD - 60000) break;
    const png = path.join(WORK, 'cut', a + '.png'); if (!fs.existsSync(png)) { st[a] = { skip: 'нет вырезки' }; save(); continue; }
    // resume: a run cut off (429 wait > process timeout) after the backup — the backup stays «before»; if the main photo is already new, no second upload
    const BF = BK + `global_photo_${a}_before.json`; const resumed = fs.existsSync(BF);
    const before = resumed ? JSON.parse(fs.readFileSync(BF, 'utf8')) : await exp(a); if (!resumed) fs.writeFileSync(BF, JSON.stringify(before));
    if (resumed) { const now = await exp(a); if (fname(now.images[0]) !== fname(before.images[0])) { let after = now, restored = null;
        if (['characteristics', 'alt_parent'].some(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))) { restored = await restore(a, before, after); await sleep(2000); after = await exp(a); }
        fs.writeFileSync(BK + `global_photo_${a}_after.json`, JSON.stringify(after)); const bad = F.filter(k => k !== 'images' && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
        const bi = before.images.map(fname), ai = after.images.map(fname); if (ai.length !== bi.length || ai.slice(1).join() !== bi.slice(1).join()) bad.push('gallery');
        if (bad.length) stop(`${a} (resumed): ${bad.join('; ')}`); st[a] = { done: true, resumed: true, old: bi[0], new: ai[0], restored, at: new Date().toISOString() }; save(); console.log(a, 'resumed: photo already replaced, checked', restored ? 'restored ' + JSON.stringify(restored) : ''); continue; } }
    const dir = ORIG + a + '/'; fs.mkdirSync(dir, { recursive: true });
    for (const [i, u] of before.images.entries()) { const f = dir + String(i).padStart(2, '0') + path.extname(fname(u)); if (fs.existsSync(f)) continue; await sleep(500);
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) stop(`backup photo ${a} ${i}: HTTP ${r.status}`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
    const l = await call('horoshop_admin_list', { entity: 'products', search: a }); const rec = (l.records || []).filter(x => x.code === a || (x.cells || [])[0] === a); if (rec.length !== 1) stop('admin id ' + a + ': ' + rec.length);
    const id = rec[0].id; const g = await call('horoshop_admin_record_get', { entity: 'products', id, fields: ['images'] }); const slot = (g.fileFields || [])[0];
    if (!slot || g.fileFields.length !== before.images.length) stop(`${a}: slots ${(g.fileFields || []).length} ≠ photos ${before.images.length}`);
    const up = await call('horoshop_admin_upload_image', { entity: 'products', id, field: slot, base64: fs.readFileSync(png).toString('base64'), filename: a + '.png', dryRun: false });
    if (up.error || up.isError || up.ok === false) stop('upload ' + a + ' ' + JSON.stringify(up).slice(0, 300));
    await sleep(3000); let after = await exp(a); let restored = null;
    if (['characteristics', 'alt_parent'].some(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))) { restored = await restore(a, before, after); await sleep(2000); after = await exp(a); }
    fs.writeFileSync(BK + `global_photo_${a}_after.json`, JSON.stringify(after));
    const bad = F.filter(k => k !== 'images' && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    const bi = before.images.map(fname), ai = after.images.map(fname); const changed = ai.map((x, i) => x !== bi[i] ? i : -1).filter(i => i >= 0);
    if (ai.length !== bi.length) bad.push(`images ${bi.length} -> ${ai.length}`); if (changed.join() !== '0') bad.push('changed photo slots: ' + (changed.join(',') || 'none'));
    if (bad.length) { st[a] = { id, slot, bad, changed }; stop(`${a}: ${bad.join('; ')} — check the gallery; originals in ${dir}`); }
    // the storefront serves the new main photo with transparency
    const r = await fetch(after.images[0], { headers: { 'user-agent': 'Mozilla/5.0' } }); const buf = Buffer.from(await r.arrayBuffer()); let alpha = false;
    try { const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); alpha = data[3] < 10 && data[(info.width * info.height - 1) * 4 + 3] < 10; } catch (e) { }
    st[a] = { done: true, id, slot, old: bi[0], new: ai[0], alpha, restored, at: new Date().toISOString() }; save(); console.log(a, 'main photo replaced', bi[0], '->', ai[0], alpha ? 'transparent' : 'NOT TRANSPARENT', restored ? 'restored ' + JSON.stringify(restored) : '');
    if (!alpha) stop(a + ': the stored main photo is not transparent'); }
  const v = Object.values(st); console.log('done', v.filter(x => x.done).length, 'of', list.length); S.close(); })().catch(e => { console.error(e); save(); S.close(); process.exit(1); });
