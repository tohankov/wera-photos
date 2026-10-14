// Page-1 text of a WERA datasheet, line by line (y-sorted). node dstext.mjs file.pdf
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])), verbosity: 0 }).promise;
const out = [];
for (let p = 1; p <= Math.min(doc.numPages, 2); p++) {
  const tc = await (await doc.getPage(p)).getTextContent();
  const lines = {};
  for (const i of tc.items) { if (!i.str.trim()) continue; const y = Math.round(i.transform[5] / 3) * 3; (lines[y] = lines[y] || []).push({ x: i.transform[4], s: i.str.trim() }); }
  for (const y of Object.keys(lines).map(Number).sort((a, b) => b - a)) out.push(`p${p} ` + lines[y].sort((a, b) => a.x - b.x).map(i => i.s).join(' | '));
}
console.log(out.join('\n'));
