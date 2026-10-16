// Download missing WERA datasheets (ru) of a group into batch/ds and extract page-1 text. node cat/ds_fetch.js <rootId>
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const DS = path.join(__dirname, '../batch/ds'); const I = require(`./${process.argv[2]}_items.json`);
(async () => { let ok = 0, miss = [];
  for (const it of I) { const t = path.join(DS, it.a + '.txt'); if (fs.existsSync(t)) continue; const pdf = path.join(DS, it.a + '.pdf');
    if (!fs.existsSync(pdf)) { await sleep(1000); let r, b; for (let k = 0; k < 3; k++) { try { r = await fetch(`https://hybris-media.wera.de/download/pdfgenerator-datasheets/ru/${it.a}.pdf`); b = Buffer.from(await r.arrayBuffer()); break; } catch (e) { r = { status: 0 }; b = Buffer.alloc(0); await sleep(5000); } }
      if (r.status !== 200 || b.slice(0, 4).toString() !== '%PDF') { miss.push(it.a); continue; } fs.writeFileSync(pdf, b); }
    try { fs.writeFileSync(t, execFileSync('node', [path.join(__dirname, '../lib/dstext.mjs'), pdf], { encoding: 'utf8' })); ok++; } catch (e) { miss.push(it.a + ' (text)'); } }
  console.log('extracted', ok, 'missing', miss.length, miss.join(' ')); })();
