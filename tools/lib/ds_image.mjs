// The product picture of a WERA datasheet (batch/ds/<art>.pdf): the largest raster image of page 1 — WERA's own current picture of THIS article
// (wera.de shows one picture per series for single tools). Owner 27.10.2026, rule А: the main photo = the current WERA picture.
//   node lib/ds_image.mjs <out dir> <art> [art ...]   -> <out dir>/<art>_ds.png  (prints width x height or why not)
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const sharp = require('sharp');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const MAIN = !!(process.argv[1] && process.argv[1].endsWith('ds_image.mjs')); const [, , OUT, ...arts] = process.argv; if (MAIN) fs.mkdirSync(OUT, { recursive: true });
const DS = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../batch/ds/');
export async function dsImage(a) { const f = DS + a + '.pdf'; if (!fs.existsSync(f)) return { why: 'нет паспорта' };
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(f)), verbosity: 0, isEvalSupported: false }).promise; const page = await doc.getPage(1);
  const ops = await page.getOperatorList(); let best = null;
  for (let i = 0; i < ops.fnArray.length; i++) { if (ops.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue; const name = ops.argsArray[i][0];
    const img = await new Promise(r => { try { page.objs.get(name, r); } catch { r(null); } }); if (!img || !img.data) continue;
    if (img.width === 1587 && img.height === 752) continue;   // the WERA logo of the page header
    if (!best || img.width * img.height > best.width * best.height) best = img; }
  await doc.destroy(); if (!best) return { why: 'в паспорте нет картинки' };
  const ch = best.data.length / (best.width * best.height); if (![1, 3, 4].includes(ch)) return { why: 'формат картинки ' + ch };
  const png = await sharp(Buffer.from(best.data), { raw: { width: best.width, height: best.height, channels: ch } }).png().toBuffer(); return { png, w: best.width, h: best.height }; }
if (MAIN) for (const a of arts) { const r = await dsImage(a); if (r.png) { fs.writeFileSync(path.join(OUT, a + '_ds.png'), r.png); console.log(a, r.w + 'x' + r.h); } else console.log(a, r.why); }
