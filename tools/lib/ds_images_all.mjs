// Every raster picture of a WERA datasheet (batch/ds/<art>.pdf), all pages, with its position on the page — for set positions that have neither our
// product nor a wera.de row (owner 03.11.2026: the picture is cut out of the set's datasheet). Page header logo (1587×752) skipped.
//   node lib/ds_images_all.mjs <out dir> <art>   -> <out dir>/<art>_p<page>_<n>.png + list (page, n, w×h, y on the page — top first)
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const sharp = require('sharp');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const [, , OUT, a] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const DS = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../batch/ds/');
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(DS + a + '.pdf')), verbosity: 0, isEvalSupported: false }).promise;
for (let pn = 1; pn <= doc.numPages; pn++) { const page = await doc.getPage(pn); const ops = await page.getOperatorList(); const H = page.view[3]; let ctm = [1, 0, 0, 1, 0, 0]; const stack = []; let n = 0;
  const mul = (m, t) => [m[0] * t[0] + m[2] * t[1], m[1] * t[0] + m[3] * t[1], m[0] * t[2] + m[2] * t[3], m[1] * t[2] + m[3] * t[3], m[0] * t[4] + m[2] * t[5] + m[4], m[1] * t[4] + m[3] * t[5] + m[5]];
  for (let i = 0; i < ops.fnArray.length; i++) { const f = ops.fnArray[i];
    if (f === pdfjs.OPS.save) stack.push(ctm); else if (f === pdfjs.OPS.restore) ctm = stack.pop() || ctm; else if (f === pdfjs.OPS.transform) ctm = mul(ctm, ops.argsArray[i]);
    if (f !== pdfjs.OPS.paintImageXObject) continue; const id = ops.argsArray[i][0]; const store = id.startsWith('g_') ? page.commonObjs : page.objs;   // shared images live in commonObjs
    const img = await new Promise(r => { const t = setTimeout(() => r(null), 3000); try { store.get(id, v => { clearTimeout(t); r(v); }); } catch { clearTimeout(t); r(null); } });
    if (!img || !img.data || (img.width === 1587 && img.height === 752)) continue; const ch = img.data.length / (img.width * img.height); if (![1, 3, 4].includes(ch)) continue;
    n++; const file = path.join(OUT, `${a}_p${pn}_${n}.png`); await sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels: ch } }).png().toFile(file);
    console.log(pn, n, img.width + 'x' + img.height, 'y', Math.round(H - ctm[5] - ctm[3]), 'x', Math.round(ctm[4]), 'h', Math.round(ctm[3])); } }
await doc.destroy();
