// Group «Тріскачки та приладдя Zyklop» (1270): filter values from OUR data only — section, series table row, title, WERA datasheets.
// Characteristics: vyd_instrumentu (new), pryvid (new), profil (reused from bits — same meaning/format), rozmir_holovky, dovzhyna_holovky (new: own sorted dictionaries).
const fs = require('fs'), path = require('path');
const I = require('./1270_items.json');
const SOCK = { 1273: 'Торцева головка', 1285: 'Торцева головка', 1299: 'Торцева головка', 1310: 'Торцева головка', 1283: 'Торцева головка подовжена', 1296: 'Торцева головка подовжена', 1308: 'Торцева головка подовжена',
  1286: 'Торцева головка з фіксуючою функцією', 1300: 'Торцева головка з фіксуючою функцією', 1311: 'Торцева головка з фіксуючою функцією', 1302: 'Торцева головка ударна Impaktor', 1461: 'Торцева головка ударна Impaktor', 1297: 'Торцева головка ударна Impaktor подовжена' };
const SCREW = { 1279: 'TX', 1292: 'TX', 1304: 'TX', 1280: 'HEX', 1293: 'HEX', 1305: 'HEX', 1288: 'PH', 1289: 'PZ', 1290: 'SL' };
const RATCH = [1275, 1287, 1301, 1312], RSETS = [1282, 1295, 1307, 1274], HSETS = [1281, 1294, 1306], ACC = [1284, 1298, 1309];
const DRIVE = { 1278: '1/4', 1303: '3/8', 1291: '1/2', 1276: '1/2', 1277: '1/2' };
const t = require('../sections/tree_now.json'); const parentOf = Object.fromEntries(t.map(p => [p.id, p.parent]));
const driveOfSec = s => { let x = s; while (x && !DRIVE[x]) x = parentOf[x]; return DRIVE[x] || null; };
const PROF = { TX: 'TX (TORX®)', HEX: 'HEX (шестигранник)', PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', SL: 'SL (шліц)', SOCK: 'Торцева головка (зовнішній шестигранник)' };
const VYD_RU = { 'Торцева головка': 'Торцевая головка', 'Торцева головка подовжена': 'Торцевая головка удлинённая', 'Торцева головка з фіксуючою функцією': 'Торцевая головка с фиксирующей функцией', 'Торцева головка ударна Impaktor': 'Торцевая головка ударная Impaktor', 'Торцева головка ударна Impaktor подовжена': 'Торцевая головка ударная Impaktor удлинённая', 'Викруткова головка': 'Отвёрточная головка', 'Тріскачка': 'Трещотка', 'Набір з тріскачкою': 'Набор с трещоткой', 'Набір головок': 'Набор головок', 'Приладдя': 'Принадлежности' };
const DRV = { '1/4': 'квадрат 1/4″', '3/8': 'квадрат 3/8″', '1/2': 'квадрат 1/2″', hex: 'шестигранник 1/4″', mini2: 'Zyklop Mini 2 (пряме приєднання головок)' };
const DRV_RU = { 'квадрат 1/4″': 'квадрат 1/4″', 'квадрат 3/8″': 'квадрат 3/8″', 'квадрат 1/2″': 'квадрат 1/2″', 'шестигранник 1/4″': 'шестигранник 1/4″', 'Zyklop Mini 2 (пряме приєднання головок)': 'Zyklop Mini 2 (прямое присоединение головок)' };
const num = s => String(s).replace('.', ',').trim(); const mm = s => num(s).replace(/,0$/, '') + ' мм';
const inch = s => String(s).replace(/["”″]/g, '').trim() + '″';
function size(it, kind) {
  const r = it.row || {}; const n = it.title.replace(/(\d), (\d)/g, '$1,$2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/[хХ×]/g, 'x');
  if (kind === 'SOCK') { const m1 = r['Розмір мм'], d1 = r['Розмір дюйми']; if (m1 && m1 !== '-') return [mm(m1), 'таблица']; if (d1 && d1 !== '-') return [inch(d1), 'таблица'];
    let m = n.match(/дюймова (\d+(?: \d+)?\/\d+|\d+)″/) || n.match(/(\d+\/\d+|\d+ \d+\/\d+)″,? ?(?:привід|x)/) || n.match(/Impaktor Deep, (\d+\/\d+|\d+)″/) || n.match(/Impaktor (\d+)″x/); if (m) return [inch(m[1]), 'название'];
    m = n.match(/(?:Zyklop Mini 2|Zyklop 1\/4″|Zyklop 3\/8″|Zyklop 1\/2″|функцією|подовжена) (\d+(?:,\d+)?)x\d/) || n.match(/(?:Deep|Impaktor|Deep,) (\d+(?:,\d+)?) мм/) || n.match(/ (\d+(?:,\d+)?)x\d+ мм/); if (m) return [mm(m[1]), 'название']; return [null, 'нет размера'];
  }
  if (kind === 'TX') { const p = r['Профіль']; let m = p && String(p).match(/TX ?(\d+)/); if (m) return [m[1], 'таблица']; m = n.match(/TX ?(\d+)/); return m ? [m[1], 'название'] : [null, 'нет размера']; }
  if (kind === 'PH' || kind === 'PZ') { const p = r['Профіль']; let m = (p && String(p).match(/(?:PH|PZ) ?(\d)/)) || n.match(/(?:PH|PZ) ?(\d)(?![\d,])/); return m ? [m[1], p ? 'таблица' : 'название'] : [null, 'нет размера']; }
  if (kind === 'HEX') { const m1 = r['Розмір мм'], d1 = r['Розмір дюйми']; if (m1 && m1 !== '-') { const v = num(m1); return [/,/.test(v) ? v : v + ',0', 'таблица']; } if (d1 && d1 !== '-') return [inch(d1), 'таблица'];
    const m = n.match(/HEX ?(\d+\/\d+)″/) || n.match(/HEX ?(\d+(?:,\d+)?)/); if (!m) return [null, 'нет размера']; return [/\//.test(m[1]) ? m[1] + '″' : (/,/.test(m[1]) ? m[1] : m[1] + ',0'), 'название']; }
  if (kind === 'SL') { const w = r['Ширина робочого кінця мм']; if (w) { const v = num(w); return [/,/.test(v) ? v : v + ',0', 'таблица']; } const m = n.match(/SL ?(\d+(?:,\d+)?)x/) || n.match(/SL \d+(?:,\d+)?x(\d+(?:,\d+)?)/); return m ? [/,/.test(m[1]) ? m[1] : m[1] + ',0', 'название'] : [null, 'нет размера']; }
  return [null, '—'];
}
function length(it) { const r = it.row || {}; const L = r['Загальна довжина мм']; if (L && L !== '-') return [mm(L), 'таблица'];
  const n = it.title.replace(/[хХ×]/g, 'x'); const m = n.match(/x ?(\d+(?:[.,]\d+)?) ?мм(?!.*x ?\d+ ?мм)/); if (m) return [mm(m[1]), 'название'];
  const f = path.join(__dirname, '../batch/ds', it.a + '.txt'); if (fs.existsSync(f)) { const h = fs.readFileSync(f, 'utf8').split('\n')[0]; const d = h.match(/ x (\d+(?:\.\d+)?) мм\s*$/); if (d) return [mm(d[1]), 'даташит']; }
  return [null, 'нет длины']; }
const out = [], disputed = [];
for (const it of I) {
  // leaf section of this group the item is shown in (main if inside the group, else the first alt inside)
  const sec = it.secs[0]; const n = it.title;
  let vyd, kind = null;
  if (SOCK[sec]) { vyd = SOCK[sec]; if (sec === 1308 && /Impaktor/i.test(n)) vyd = 'Торцева головка ударна Impaktor подовжена'; kind = 'SOCK'; }
  else if (SCREW[sec]) { vyd = 'Викруткова головка'; kind = SCREW[sec]; }
  else if (RATCH.includes(sec) || (/^(Тріскачка|Трещітка|Zyklop Hybrid 8006 C|Тріскачка з функцією)/i.test(n) && [1276, 1277].includes(sec))) vyd = 'Тріскачка';
  else if (['05049005001', '05049004001'].includes(it.a)) vyd = 'Приладдя';   // owner 21.10.2026: adapter 9549 / hinge 9550 Tool-Check Modular in «Набори Zyklop Mini»
  else if (RSETS.includes(sec) || (sec === 1271) || (/набір/i.test(n) && [1276, 1277].includes(sec))) vyd = 'Набір з тріскачкою';
  else if (HSETS.includes(sec)) vyd = /неукомплект|тримач[^,]*неукомплект/i.test(n) || /^Пояс/i.test(n) ? 'Приладдя' : 'Набір головок';
  else if (ACC.includes(sec) || [1276, 1277].includes(sec)) vyd = 'Приладдя';
  // drive
  let drv = []; const d = driveOfSec(sec); const tt = n.replace(/(\d) ?["”″]/g, '$1″');
  if (sec === 1271) drv = [DRV['3/8'], DRV.hex]; // datasheet 8009 Zyklop Pocket: 3/8″ ratchet + bit ratchet for 1/4″ bits
  else if (sec === 1273) drv = [DRV['1/4']]; // datasheet 8790 FA: «с приводом 1/4"», for Zyklop Mini 2 and 1/4″
  else if (sec === 1275) { if (/Mini 2|Cyclop Mini 2/i.test(n)) drv.push(DRV.mini2); else if (/шестигранник 1\/4|для біт/i.test(n)) drv.push(DRV.hex); else if (/1\/4|¼/.test(tt)) drv.push(DRV['1/4']); }
  else if (sec === 1274) { // sets: drive from the composition in the WERA datasheet (bits -> 1/4″ hex bit ratchet/holder; 8790 HMA sockets / 870/1 adapter -> 1/4″ square; 8790 FA / 8005 -> Mini 2)
    const f = path.join(__dirname, '../batch/ds', it.a + '.set.json'); let codes = ''; try { codes = JSON.parse(fs.readFileSync(f, 'utf8')).map(x => (x.code || '') + ' ' + x.head).join(' | '); } catch (e) {}
    if (/8790 FA|8005/.test(codes)) drv.push(DRV.mini2); if (/\b8[4-7]\d\/[1-9]|\b800\/1|\b3[0-9]{3}\/1|8011|813\b|889\/4/.test(codes)) drv.push(DRV.hex); if (/8790 HMA|870\/1/.test(codes)) drv.push(DRV['1/4']); }
  else if (d) drv = [DRV[d]];
  out.push({ a: it.a, title: n, sec, secs: it.secs, vyd, kind, drv: [...new Set(drv)], profile: kind ? (kind === 'SOCK' ? PROF.SOCK : PROF[kind]) : null, size: kind ? size(it, kind) : [null, ''], len: kind ? length(it) : [null, ''], alt: !it.secs.includes(it.sec) });
}
// accessory / foreign item rule: anything missing a value gets ALL values of its leaf section (non-head items in a heads section; alt products)
const bySec = {}; for (const v of out) (bySec[v.sec] = bySec[v.sec] || []).push(v);
for (const v of out) {
  if (!v.vyd) { const vals = [...new Set(bySec[v.sec].map(x => x.vyd).filter(Boolean))]; if (vals.length) { v.vyd = vals; v.fill = 'вид: все значения раздела'; } }
  if (!v.drv.length) { const vals = [...new Set(bySec[v.sec].flatMap(x => x.drv))]; if (vals.length) { v.drv = vals; v.fill = (v.fill ? v.fill + '; ' : '') + 'привод: все значения раздела'; } }
  if (v.kind) { if (!v.size[0]) disputed.push({ a: v.a, sec: v.sec, what: 'Розмір головки', why: v.size[1], title: v.title }); if (!v.len[0]) disputed.push({ a: v.a, sec: v.sec, what: 'Довжина головки', why: v.len[1], title: v.title }); }
  if (!v.vyd || (Array.isArray(v.vyd) && !v.vyd.length)) disputed.push({ a: v.a, sec: v.sec, what: 'Вид інструменту', why: 'не определён', title: v.title });
  if (!v.drv.length) disputed.push({ a: v.a, sec: v.sec, what: 'Привід', why: 'не определён', title: v.title });
}
module.exports = { out, disputed, VYD_RU, DRV_RU };
if (require.main === module) {
  console.log('items', out.length, 'heads', out.filter(v => v.kind).length, 'disputed', disputed.length);
  const c = k => { const m = {}; for (const v of out) for (const x of [].concat(k(v)).filter(Boolean)) m[x] = (m[x] || 0) + 1; return m; };
  console.log('vyd', c(v => v.vyd)); console.log('drv', c(v => v.drv)); console.log('size', Object.keys(c(v => v.size[0])).length, 'len', c(v => v.len[0]));
  console.log(disputed.slice(0, 40).map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 70)}`).join('\n'));
  console.log('filled with section values:', out.filter(v => v.fill).map(v => v.a + ' ' + v.fill).join('\n'));
}
