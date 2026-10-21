// Re-extract batch/ds/<art>.txt with ALL pages (lib/dstext.mjs read only pages 1–2 until 22.10.2026) for every datasheet with more than 2 pages.
// Resumable, foreground chunks: node cat/ds_retext.mjs [maxSeconds=100] -> cat/ds_retext_state.json {done: {art: pages}, changed: [art]}
// The old .txt is copied to backup/ds_txt_1022/ before it is overwritten.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DS = path.join(HERE, '../batch/ds'), BK = path.join(HERE, '../../backup/ds_txt_1022'), SF = path.join(HERE, 'ds_retext_state.json');
const S = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: {}, changed: [] }; fs.mkdirSync(BK, { recursive: true });
const until = Date.now() + 1000 * +(process.argv[2] || 100);
const arts = fs.readdirSync(DS).filter(f => /^\d{11}\.pdf$/.test(f)).map(f => f.slice(0, 11)).filter(a => !(a in S.done));
let n = 0;
for (const a of arts) { if (Date.now() > until) break; n++;
  let doc; try { doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(DS, a + '.pdf'))), verbosity: 0 }).promise; } catch (e) { S.done[a] = -1; continue; }
  S.done[a] = doc.numPages;
  if (doc.numPages > 2) { const out = [];
    for (let p = 1; p <= doc.numPages; p++) { const tc = await (await doc.getPage(p)).getTextContent(); const lines = {};
      for (const i of tc.items) { if (!i.str.trim()) continue; const y = Math.round(i.transform[5] / 3) * 3; (lines[y] = lines[y] || []).push({ x: i.transform[4], s: i.str.trim() }); }
      for (const y of Object.keys(lines).map(Number).sort((a, b) => b - a)) out.push(`p${p} ` + lines[y].sort((a, b) => a.x - b.x).map(i => i.s).join(' | ')); }
    const t = path.join(DS, a + '.txt'), txt = out.join('\n') + '\n';
    if (fs.existsSync(t) && fs.readFileSync(t, 'utf8') !== txt) { if (!fs.existsSync(path.join(BK, a + '.txt'))) fs.copyFileSync(t, path.join(BK, a + '.txt')); S.changed.push(a); }
    fs.writeFileSync(t, txt); }
  await doc.destroy();
  if (n % 100 === 0) fs.writeFileSync(SF, JSON.stringify(S)); }
fs.writeFileSync(SF, JSON.stringify(S));
const left = fs.readdirSync(DS).filter(f => /^\d{11}\.pdf$/.test(f)).filter(f => !(f.slice(0, 11) in S.done)).length;
const pages = Object.values(S.done); console.log('this run', n, 'checked', pages.length, '>2 pages', pages.filter(x => x > 2).length, 'txt changed', S.changed.length, 'unreadable', pages.filter(x => x < 0).length, 'left', left);
