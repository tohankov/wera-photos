// Download missing WERA datasheets (ru) in chunks, resumable: node names/ds_chunk.js [maxFiles=200] [maxSeconds=540]
// Skips articles that already have batch/ds/<art>.txt and those already tried (names/ds_progress.json: done / miss). Progress is saved after every file,
// so an interrupted run continues from the same place. 429/403 -> the pause doubles (up to 60 s); still blocked at 60 s -> stop with exit code 2.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const DS = path.join(__dirname, '../batch/ds'), PF = path.join(__dirname, 'ds_progress.json');
const MAX = +process.argv[2] || 200, SEC = +process.argv[3] || 540, t0 = Date.now();
const P = fs.existsSync(PF) ? JSON.parse(fs.readFileSync(PF, 'utf8')) : { pause: 1000, done: [], miss: {}, blocks: 0 };
const save = () => fs.writeFileSync(PF, JSON.stringify(P));
const A = [...new Set(require('./catalog.json').map(p => p.article).filter(a => /^\d{11}$/.test(a)))];
const todo = A.filter(a => !fs.existsSync(path.join(DS, a + '.txt')) && !P.miss[a]);
(async () => { let n = 0, ok = 0, miss = 0;
  for (const a of todo) { if (n >= MAX || (Date.now() - t0) / 1000 > SEC) break; n++;
    const pdf = path.join(DS, a + '.pdf'), txt = path.join(DS, a + '.txt');
    if (!fs.existsSync(pdf)) { let r, b, net = 0;
      for (;;) { await sleep(P.pause);
        try { r = await fetch(`https://hybris-media.wera.de/download/pdfgenerator-datasheets/ru/${a}.pdf`); b = Buffer.from(await r.arrayBuffer()); } catch (e) { r = { status: 0 }; b = Buffer.alloc(0); }
        if (r.status === 429 || r.status === 403) { P.blocks++; if (P.pause >= 60000) { save(); console.log(`BLOCK: WERA answers ${r.status} at pause 60 s (${a}) — stopped`); process.exit(2); }
          P.pause = Math.min(60000, P.pause * 2); save(); console.log(`WERA ${r.status} -> pause ${P.pause / 1000} s`); continue; }
        if (r.status === 0 && ++net < 3) { await sleep(5000); continue; }   // network error: two more tries, then counted as missing
        break; }
      if (r.status !== 200 || b.slice(0, 4).toString() !== '%PDF') { P.miss[a] = `HTTP ${r.status}`; miss++; save(); continue; } fs.writeFileSync(pdf, b); }
    try { fs.writeFileSync(txt, execFileSync('node', [path.join(__dirname, '../lib/dstext.mjs'), pdf], { encoding: 'utf8' })); P.done.push(a); ok++; } catch (e) { P.miss[a] = 'text'; miss++; }
    save(); }
  const left = A.filter(a => !fs.existsSync(path.join(DS, a + '.txt')) && !P.miss[a]).length;
  console.log(`chunk: tried ${n}, ok ${ok}, miss ${miss} | total done ${P.done.length}, miss ${Object.keys(P.miss).length}, left ${left}, pause ${P.pause / 1000} s, ${Math.round((Date.now() - t0) / 1000)} s`); })();
