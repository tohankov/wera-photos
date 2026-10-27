// Rule А review sheets of one group after photos_audit/wera_cmp.mjs: single tools — the handle end crop «наше | паспорт WERA» (zoom_sheet.js, 30 per sheet,
// sorted by WERA series), sets / products with their own page — full pictures «наше | паспорт | wera.de» (14 per sheet). Every sheet is looked at by eye.
//   node photos_audit/cmp_sheets.js <group live.json> <cmp work dir> <out dir>   -> <out>/z_NN.jpg, <out>/s_NN.jpg, <out>/order.json
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp'); const { execFileSync } = require('child_process');
const ds = require('../names/ds.js'); const C = require('../cat/ds_comp_all.json'); const [, , LIVE, W, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const c = JSON.parse(fs.readFileSync(path.join(W, 'cmp.json'), 'utf8')); const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1 && c[p.article]);
const isSet = p => (C[p.article] || []).some(g => g.items && g.items.length) || /^Набір/.test(p.mod_title.ua);
const ser = a => ((ds(a) || {}).series || '') + ' ' + a;
const singles = L.filter(p => !isSet(p) && /x/.test(c[p.article].ds || '')).map(p => p.article).sort((a, b) => ser(a).localeCompare(ser(b)));
const sets = L.filter(p => isSet(p) || !/x/.test(c[p.article].ds || '')).map(p => p.article).sort((a, b) => ser(a).localeCompare(ser(b)));
for (let i = 0; i * 30 < singles.length; i++) execFileSync('node', [path.join(__dirname, 'zoom_sheet.js'), W, path.join(OUT, 'z_' + String(i + 1).padStart(2, '0') + '.jpg'), ...singles.slice(i * 30, i * 30 + 30)]);
const cf = u => path.join(W, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const cell = async f => f && fs.existsSync(f) ? sharp(f).flatten({ background: '#fff' }).resize(290, 200, { fit: 'contain', background: '#fff' }).toBuffer() : sharp({ create: { width: 290, height: 200, channels: 3, background: '#444' } }).png().toBuffer();
(async () => { for (let s = 0; s * 14 < sets.length; s++) { const rows = sets.slice(s * 14, s * 14 + 14); const comp = [];
    for (const [i, a] of rows.entries()) { const x0 = (i % 2) * 920, y = Math.floor(i / 2) * 225;
      comp.push({ input: Buffer.from(`<svg width="910" height="20"><rect width="100%" height="100%" fill="#000"/><text x="4" y="15" font-family="Arial" font-size="15" fill="#fff">${a} (наше | паспорт | wera.de)</text></svg>`), left: x0, top: y });
      for (const [j, f] of [cf(c[a].ours), path.join(W, 'ds', a + '.png'), c[a].wera ? cf(c[a].wera) : null].entries()) comp.push({ input: await cell(f), left: x0 + j * 300, top: y + 22 }); }
    await sharp({ create: { width: 1840, height: Math.ceil(rows.length / 2) * 225, channels: 3, background: '#666' } }).composite(comp).jpeg({ quality: 80 }).toFile(path.join(OUT, 's_' + String(s + 1).padStart(2, '0') + '.jpg')); }
  fs.writeFileSync(path.join(OUT, 'order.json'), JSON.stringify({ singles, sets })); console.log('singles', singles.length, 'sheets', Math.ceil(singles.length / 30), '| sets', sets.length, 'sheets', Math.ceil(sets.length / 14)); })();
