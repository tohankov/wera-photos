// Set composition from a WERA datasheet ("Содержимое:" pages): groups of {code, items:[{art, qty, size}]}.
// node lib/ds_set.mjs file.pdf -> JSON on stdout
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])), verbosity: 0 }).promise;
const lines = [];
for (let p = 1; p <= doc.numPages; p++) {
  const tc = await (await doc.getPage(p)).getTextContent(); const L = {};
  for (const i of tc.items) { if (!i.str.trim()) continue; const y = Math.round(i.transform[5] / 3) * 3; (L[y] = L[y] || []).push({ x: i.transform[4], s: i.str.trim() }); }
  for (const y of Object.keys(L).map(Number).sort((a, b) => b - a)) lines.push({ p, t: L[y].sort((a, b) => a.x - b.x).map(i => i.s) });
}
const start = lines.findIndex(l => l.t.join(' ') === 'Содержимое:');
const groups = [];
if (start >= 0) for (const l of lines.slice(start + 1)) {
  const s = l.t.join(' | ');
  if (/^Ссылка|^https?:|^Wera |^\d{2}\.\d{2}\.\d{4}|^Powered|Korzerter|Wuppertal|^Tel:|E-Mail/.test(s)) continue;
  const m = s.match(/^(0\d{10}) \| (\d+)x \| (.+)$/);
  if (m) { if (groups.length) groups[groups.length - 1].items.push({ art: m[1], qty: +m[2], size: m[3].replace(/\s*\|\s*/g, ' ') }); continue; }
  if (/^\d\)/.test(s)) continue;              // footnote marks / texts
  if (/^0\d{10}/.test(s)) continue;
  groups.push({ head: l.t.join(' '), code: (l.t.join(' ').match(/^[0-9A-Za-z/ .\-®+]+?(?=\s+[А-Яа-яЁё]|$)/) || [''])[0].trim(), items: [] });
}
console.log(JSON.stringify(groups.filter(g => g.items.length)));
