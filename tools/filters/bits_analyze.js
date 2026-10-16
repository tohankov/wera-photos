// Filters pilot «Біти» (1062 + subsections): derive filter values for every bit from OUR data only —
// title, section, description (series table, characteristics, text), WERA series map (a422/codes.json), downloaded datasheets.
// Read-only: input filters/bits_live.json (live export), output filters/bits_values.json + inventory/filters_bits_preview.xlsx.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const T = path.join(__dirname, '..'); const B = require('./bits_live.json'); const V = require('../lib/vt.js');
const codes = require('../a422/codes.json'); const series = {}; for (const [m, l] of Object.entries(codes)) for (const a of l) series[a] = m;
const tree = require('../sections/tree_now.json'); const secName = Object.fromEntries(tree.map(p => [p.id, p.title.ua]));
const ds = a => { const f = path.join(T, 'batch/ds', a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const strip = h => (h || '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const num = s => s.replace('.', ',');
// profile of a section (the section is the most reliable signal)
const SEC = { 1079: 'PH', 1080: 'PZ', 1075: 'PM', 1071: 'SL', 1073: 'HEX', 1074: 'HEXBO', 1069: 'TX', 1070: 'TXBO', 1068: 'IPR', 1067: 'IP', 1066: 'TQ', 1078: 'NUT', 1063: 'XZN', 1065: 'MICROSTIX', 1072: 'SQ', 1076: 'TW', 1077: 'TENSION' };
const PROF = { PH: ['Phillips (PH)', 'Phillips (PH)'], PZ: ['Pozidriv (PZ)', 'Pozidriv (PZ)'], PM: ['PlusMinus (PH/PZ + шліц)', 'PlusMinus (PH/PZ + шлиц)'], SL: ['Шліц (SL)', 'Шлиц (SL)'],
  HEX: ['Шестигранник (HEX)', 'Шестигранник (HEX)'], HEXBO: ['Шестигранник з отвором (HEX BO)', 'Шестигранник с отверстием (HEX BO)'], TX: ['TORX® (TX)', 'TORX® (TX)'], TXBO: ['TORX® з отвором (TX BO)', 'TORX® с отверстием (TX BO)'],
  IP: ['TORX PLUS® (IP)', 'TORX PLUS® (IP)'], IPR: ['TORX PLUS® IPR', 'TORX PLUS® IPR'], TQ: ['TORQ-SET® Mplus', 'TORQ-SET® Mplus'], NUT: ['Зовнішній шестигранник (торцева головка)', 'Наружный шестигранник (торцевая головка)'],
  XZN: ['Багатозубцевий (XZN)', 'Многозубчатый (XZN)'], MICROSTIX: ['Microstix®', 'Microstix®'], SQ: ['Внутрішній квадрат (Robertson)', 'Внутренний квадрат (Robertson)'], TW: ['TRI-WING®', 'TRI-WING®'], TENSION: ['Натяжна біта', 'Натяжная бита'] };
function analyze(p) {
  const a = p.article, sec = p.parent.id; const t = p.title.ua.replace(/ (WERA|Wera) [\w ]+$/, '');
  // normalise only the size notation: "2, 0" -> "2,0", "8.0" -> "8,0", '7/16 "' -> 7/16″, a Cyrillic/× "х" between sizes -> x
  const n = t.replace(/(\d), (\d)/g, '$1,$2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/\s*[хХ×]\s*(?=[\d#]|PH|PZ|TX)/g, 'x').replace(/(\d)[хХ×](?=\d)/g, '$1x').replace(/\s+/g, ' ');
  const d = strip(p.description.ua); const dsT = ds(a);
  const r = { a, title: p.title.ua, sec, secName: secName[sec], src: {} };
  const set = (k, v, s) => { if (v != null && r[k] == null) { r[k] = v; r.src[k] = s; } };
  // series
  set('series', series[a], 'карта серий wera.de'); const th = (p.description.ua.match(/Інші варіанти серії (?:WERA )?([^<]+)<\/h3>/) || [])[1]; set('series', th && th.trim(), 'таблица серии'); const dsS = (dsT.match(/№ артикула: \| ([^|]+)\|/) || [])[1]; set('series', dsS && dsS.trim(), 'даташит');
  const sm = n.match(/\b(\d{3,4}\/\d{1,2}(?: [A-Z]{1,4}(?: [A-Z]{1,3})?)?|\d{3,4} S)\b/); set('series', sm && sm[1], 'название');
  const S = (r.series || '') + ' '; const txt = (n + ' ' + d).toLowerCase();
  // profile
  const pk = sec === 1459 ? (/(^|\s)PH ?\d/.test(n) ? 'PH' : /(^|\s)PZ ?\d/.test(n) ? 'PZ' : /\bTX ?\d/.test(n) ? 'TX' : /HEX|шестигран/i.test(n) ? 'HEX' : /SL|шліц/i.test(n) ? 'SL' : null) : SEC[sec];
  if (pk) set('profile', PROF[pk], sec === 1459 ? 'название' : 'раздел');
  // size + length
  let m;
  if (pk === 'PH' || pk === 'PZ') { m = n.match(/\b(PH|PZ) ?(\d{1,3})(?![\d,])/); if (m) set('size', `${m[1]} ${m[2]}`, 'название'); }
  if (pk === 'PM') { m = n.match(/(PH|PZ)\/S ?(\d)/); if (m) set('size', `${m[1]} ${m[2]} / SL`, 'название'); }
  if (pk === 'TX' || pk === 'TXBO') { m = n.match(/\bTX ?(\d{1,2})(?![\d,])/); if (m) set('size', `TX ${m[1]}`, 'название'); }
  if (pk === 'IP' || pk === 'IPR') { m = n.match(/\b(IPR|IP) (\d{1,2})x/); if (m) set('size', `${m[2]} ${m[1]}`, 'название'); else { m = n.match(/(?<![\d\/])(\d{1,2}) ?(IPR|IP)(?![A-Z])/); if (m) set('size', `${m[1]} ${m[2]}`, 'название'); } }
  if (pk === 'HEX' || pk === 'HEXBO') { m = n.match(/HEX ?(\d+\/\d+|\d+(?:,\d+)?)(″)?/) || n.match(/Micro (\d+(?:,\d+)?)()x/) || n.match(/(?:дюймова|Hex-Plus).*?\b(\d+\/\d+)(″)/);
    if (m) { let v = num(m[1]); const inch = /\//.test(v) || m[2] === '″'; if (inch) v += '″'; else if (!/,/.test(v)) v += ',0'; set('size', `HEX ${v}`, 'название'); } }
  if (pk === 'SL') { m = n.match(/SL ?(\d+(?:,\d+)?)x(\d+(?:,\d+)?)x\d/) || n.match(/(\d+(?:,\d+)?)x(\d+(?:,\d+)?)x\d+ мм/); if (m) { set('size', `SL ${num(m[2]).replace(/^(\d+)$/, '$1,0')}`, 'название (ширина)'); r.slThick = num(m[1]); } // filter by blade width; old titles carry only the width
    else { m = n.match(/SL ?(\d+(?:[.,]\d+)?)x\d/); if (m) set('size', `SL ${num(m[1]).replace(/^(\d+)$/, '$1,0')}`, 'название (только ширина)'); } }
  if (pk === 'SQ') { m = n.match(/# ?(\d{1,2})/); if (m) set('size', `#${m[1]}`, 'название'); }
  if (pk === 'TW') { m = n.match(/TRI-WING® (?:Kraftform Plus 375 )?(\d)x/); if (m) set('size', `TRI-WING ${m[1]}`, 'название'); }
  if (pk === 'TQ') { m = n.match(/Mplus (?:871\/\d )?(\d+\/\d+″?|\d+)x/); if (m) set('size', `TORQ-SET ${m[1].replace(/″?$/, /\//.test(m[1]) ? '″' : '')}`, 'название'); }
  if (pk === 'XZN') { m = n.match(/\bM(\d+)x/); if (m) set('size', `XZN M${m[1]}`, 'название'); }
  if (pk === 'TENSION') { m = n.match(/натяжна (\d+)x/); if (m) set('size', `${m[1]} мм`, 'название'); }
  if (pk === 'MICROSTIX') { m = n.match(/мм (\d{0,2}|F)x4\d/); if (m) set('size', m[1] ? `Microstix ${m[1]}` : 'Microstix (без маркування)', 'название'); }
  if (pk === 'NUT') { m = n.match(/(?:головка|869\/4 M?) (?:[^\d]*?)(\d+\/\d+″|\d+(?:,\d+)?)(?: мм)?x(\d+)/) || n.match(/(\d+\/\d+″|\d+(?:,\d+)?)x(\d+) мм/); if (/шпильок/.test(n)) { const mm = n.match(/М(\d+)x/); if (mm) set('size', `шпилька M${mm[1]}`, 'название'); }
    else if (m) { const v = /″/.test(m[1]) ? m[1] : num(m[1]).replace(/,0$/, '') + ' мм'; set('size', `SW ${v}`, 'название'); } }
  // length: the series table row (wera.de data) wins over the title; a disagreement is recorded
  r.conflicts = [];
  const tb = V.splitTable(p.description.ua); const trow = tb && V.rowOf(tb[1], a);
  if (trow) { const h = V.headers(tb[1]); const i = h.findIndex(x => /Довжина|Загальна довжина/.test(x.label) && /мм/.test(x.unit || x.label)); const L = i >= 0 ? parseFloat(String(trow.vals[i]).replace(',', '.')) : NaN;
    if (L) { set('length', L, 'таблица серии'); const tl = n.match(/x ?(\d+(?:,\d+)?) ?мм(?!.*x ?\d+ ?мм)/); if (tl && +tl[1].replace(',', '.') !== L) r.conflicts.push(`длина: в названии ${tl[1]} мм, в таблице серии ${L} мм`); } }
  const lm = n.match(/x ?(\d+(?:,\d+)?) ?мм(?!.*x ?\d+ ?мм)/) || n.match(/x(\d{2,3})$/); if (lm) set('length', +lm[1].replace(',', '.'), 'название');
  // shank / drive
  if (/halfmoon/i.test(n + d)) set('shank', ['4 мм Halfmoon (Micro)', '4 мм Halfmoon (Micro)'], 'название/описание');
  m = n.match(/з різьбленням (M ?\d|#10-32 UNF)/i); if (m) set('shank', [`різьба ${m[1].replace(' ', '')}`, `резьба ${m[1].replace(' ', '')}`], 'название');
  if (/хвостовик 4 мм/.test(n) && !/halfmoon|hios/i.test(n + d)) set('shank', ['4 мм Micro', '4 мм Micro'], 'название');
  if (/hios/i.test(n + d)) set('shank', ['4 мм HIOS (Micro)', '4 мм HIOS (Micro)'], 'название/описание');
  m = (n + ' ' + d).match(/хвостовик(?:ом)? (?:з різьбленням |із різьбленням )?(M ?\d)\b|різьбов\S* хвостовик\S* (M ?\d)/i); if (m) set('shank', [`різьба ${(m[1] || m[2]).replace(' ', '')}`, `резьба ${(m[1] || m[2]).replace(' ', '')}`], 'название/описание');
  if (/5\/16″/.test(n) && /привод|хвостовик/i.test(n) || /(хвостовик|привід)[^.]{0,40}5\/16/i.test(d) || /тип хвостовика Wera 2|хвостовик Wera тип 2/.test(dsT + d)) set('shank', ['5/16″ (8 мм)', '5/16″ (8 мм)'], 'описание/даташит');
  if (/1\/4/.test(d + dsT) || /\b(1\/1|1\/4|1\/0|1\/9)\b/.test(S)) set('shank', ['1/4″ (6,3 мм)', '1/4″ (6,3 мм)'], 'описание');
  // type
  const imp = /impaktor|ударн|ударного|imp dc|\b8\d\d S\b|\b8\d\d\/\d+ IMP/i.test(n + ' ' + S) || /Impaktor/.test(d);
  const tor = /торсі|торсион|bitorsion|\bBTZ\b|\bBTH\b|\bTZ\b|\bTH\b/i.test(n + ' ' + S) || /BiTorsion|торсійн/i.test(d.slice(0, 600));
  set('type', imp ? ['Ударна (Impaktor / для ударного гвинтоверта)', 'Ударная (Impaktor / для ударного винтовёрта)'] : tor ? ['Торсійна (BiTorsion / торсійна зона)', 'Торсионная (BiTorsion / торсионная зона)'] : ['Стандартна', 'Стандартная'], imp || tor ? 'название/серия/описание' : 'по умолчанию (нет признаков ударной/торсийной)');
  // features (multi)
  const f = [];
  if (/алмаз|diamond|\bDC\b|\bADC\b|\bRDC\b/i.test(n + ' ' + S) || /алмазн\S* покритт/i.test(d.slice(0, 500))) f.push(['Алмазне покриття', 'Алмазное покрытие']);
  if (/нержав|stainless|\bTS\b/i.test(n + ' ' + S)) f.push(['Нержавіюча сталь', 'Нержавеющая сталь']);
  if (/фіксуюч|\bHF\b|\b\d{3}\/\d+ V\b/i.test(n + ' ' + S) || /фіксуюч\S* функці/i.test(d.slice(0, 400))) f.push(['З фіксуючою функцією', 'С фиксирующей функцией']);
  if (/кульков|\b842\b/i.test(n + ' ' + S)) f.push(['Кулькова головка', 'Шаровая головка']);
  if (/екстратверд|надтверд|\bA\b|\bTH\b|\bBTH\b|\bH\b/.test(n + ' ' + S) && !/\bTX\b/.test('')) f.push(['Екстратверда / тверда', 'Экстратвёрдая / твёрдая']);
  if (pk === 'NUT') f.push(/немагнітн/i.test(n) ? ['Немагнітна', 'Немагнитная'] : /магнітн/i.test(n) ? ['Магнітна', 'Магнитная'] : null);
  if (/фреза/i.test(n)) f.push(['Шліцева фреза', 'Шлицевая фреза']);
  r.features = f.filter(Boolean); if (r.features.length) r.src.features = 'название/серия/описание';
  // pack size
  m = n.match(/(\d+) шт\./) || (/^Біти /.test(t) ? null : null); if (m) set('pack', +m[1], 'название');
  r.isBit = ![1060, 1129, 1460].includes(sec) && !/набір|підставк|ручка/i.test(t);
  return r;
}
const rows = B.map(analyze);
fs.writeFileSync(path.join(__dirname, 'bits_values.json'), JSON.stringify(rows, null, 1));
module.exports = { rows };
if (require.main === module) {
  const bits = rows.filter(r => r.isBit); const pct = k => Math.round(bits.filter(r => r[k] != null).length / bits.length * 100);
  console.log('bits', bits.length, 'not bits (excluded)', rows.length - bits.length, rows.filter(r => !r.isBit).map(r => r.a + ' ' + r.title.slice(0, 50)).join(' | '));
  for (const k of ['profile', 'size', 'length', 'shank', 'type', 'series']) console.log(k, pct(k) + '%', 'missing', bits.filter(r => r[k] == null).length);
}
