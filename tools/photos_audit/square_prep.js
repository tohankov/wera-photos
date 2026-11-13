// Owner 12.11.2026 («ок» on docs/global_square_plan.md): the current main photo (same file, no new cut-out) of every elongated product goes onto a
// transparent square canvas (lib/square.js) -> <work>/cut/<art>.png for photos_audit/main_replace.js; the content size of each is kept in
// tools/vt/square_ratio.js ({art: [w, h]}) — the set block shows such a picture cropped to its centre (object-fit: cover) when w / h >= 1.7, else contain.
//   node photos_audit/square_prep.js <all export.json> <aspect.json (photos_audit/aspect_audit.js)> <work dir>   (resumable: existing cut files are kept)
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { square } = require('../lib/square.js');
const [, , ALL, ASP, WORK] = process.argv; const L = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const S = JSON.parse(fs.readFileSync(ASP, 'utf8'));
const arts = Object.values(S.summary.by).flatMap(e => e.arts); const CUT = path.join(WORK, 'cut'); fs.mkdirSync(CUT, { recursive: true });
const RF = path.join(__dirname, '../vt/square_ratio.js'); const R = fs.existsSync(RF) ? require(RF) : {}; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { let n = 0, skip = 0; for (const a of arts) { const p = L[a], c = S.checked[a]; if (!p || p.images[0] !== c.url) { console.log('main changed since the audit, skipped', a); skip++; continue; }
    const f = path.join(CUT, a + '.png'); R[a] = [c.w, c.h]; if (fs.existsSync(f)) continue; await sleep(150);
    const r = await fetch(c.url, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) { console.log('HTTP', r.status, a); skip++; continue; }
    fs.writeFileSync(f, await square(Buffer.from(await r.arrayBuffer()))); n++; }
  fs.writeFileSync(RF, '// Content size [w, h] of main photos put on a square transparent canvas (photos_audit/square_prep.js, owner 12.11.2026) — vt/setblock.js: cover if w / h >= 1.7\nmodule.exports = ' + JSON.stringify(R) + ';\n');
  fs.writeFileSync(path.join(WORK, 'list.json'), JSON.stringify(arts.filter(a => fs.existsSync(path.join(CUT, a + '.png')))));
  console.log('squares new', n, 'skipped', skip, 'total listed', arts.length); })();
