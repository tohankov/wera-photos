// Text of a WERA datasheet, ALL pages, line by line (y-sorted; «pN » = page). node dstext.mjs file.pdf
// Until 22.10.2026 only pages 1–2 were read — set compositions on page 3+ were lost (Joker 11 Set, Hex-Plus Imperial); cat/ds_retext.mjs re-extracted them.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])), verbosity: 0 }).promise;
const out = [];
for (let p = 1; p <= doc.numPages; p++) {
  const tc = await (await doc.getPage(p)).getTextContent();
  const lines = {};
  for (const i of tc.items) { if (!i.str.trim()) continue; const y = Math.round(i.transform[5] / 3) * 3; (lines[y] = lines[y] || []).push({ x: i.transform[4], s: i.str.trim() }); }
  for (const y of Object.keys(lines).map(Number).sort((a, b) => b - a)) out.push(`p${p} ` + lines[y].sort((a, b) => a.x - b.x).map(i => i.s).join(' | '));
}
console.log(out.join('\n'));
