// Global check, deep pass (owner 24.10.2026, item а): EXPLICIT check of every VISIBLE article of a group against the WERA datasheet and wera.de —
// not «generator = site». Read-only.  node cat/global_deep.js <group live.json> <out prefix>  -> <out>.json + <out>.xlsx (only mismatches)
// Sources, each independent of our generators:
//   datasheet: names/ds.js first line («350 PH Отвертка …, PH 2 x 100 мм»), page 1 text (the product's own bullets; pages 2+ are series-general);
//   wera.de: the series table row of the article (inventory/wera/pages.json: Abtriebsgröße, Klingendicke / -breite, Klingenlänge, Gesamtlänge Klinge),
//            «Produktmerkmale» of the series with the article's footnotes («Keine …»), «Werkzeuge in diesem Set» rows of a set.
// Verdict: «исправить» — WERA states it and we differ / miss it (one source enough when the other is silent, both when they disagree → «спорно»);
//          «спорно» — sources disagree, or we have a value no source states (never removed automatically).
const fs = require('fs'), path = require('path'); const X = require('xlsx'); const ds = require('../names/ds.js');
const [, , liveFile, out] = process.argv; const L = require.main === module ? JSON.parse(fs.readFileSync(liveFile, 'utf8')).filter(p => +p.display_in_showcase === 1) : [];
const W = require('../../inventory/wera/pages.json'); const COMP = require('./ds_comp_all.json');
const ch = (p, k) => (p.characteristics[k] || []).map(v => v.value.ua);
const f = s => parseFloat(String(s).replace(',', '.')); const eq = (a, b) => a.length === b.length && a.every((x, i) => typeof x === 'string' || typeof b[i] === 'string' ? String(x) === String(b[i]) : Math.abs(x - b[i]) < 1e-6);
const p1 = a => { try { return fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8').split('\n').filter(l => l.startsWith('p1 ')).map(l => l.slice(3)).join('\n').split('\nСсылка')[0]; } catch { return ''; } };
// one profile+size -> {p, n:[numbers]}; our «Профіль і розмір» («PH 2», «SL 1,0×5,5», «HEX 5,0», «HEX 3/16″», «Квадрат #2», «Pentalobe 1,4», «IP 5», «Microstix® m»)
const frac = s => /^\d+\/\d+$/.test(s) ? s.split('/').reduce((a, b) => a / b) : f(s);
function ours(v) { const m = v.match(/^(PH\/S|PZ\/S|PH|PZ|TX|IPR|IP|SL|HEX|Квадрат|TRI-WING®|TORQ-SET®|Spanner|Microstix®|Pentalobe|Торцева)\s+(.+)$/); if (!m) return { p: '?', raw: v };
  const nums = m[2].replace(/[#″мм]/g, '').trim(); return { p: m[1], n: /^[a-zA-Z]+$/.test(nums) || /^P[HZ](\/S)?$/.test(m[1]) ? [nums] : nums.split('×').map(x => frac(x.trim())), raw: v }; }
// a WERA size text (datasheet / wera.de) + the tool name -> {p, n, len}; null when the profile cannot be read
// WERA series numbers whose names carry no profile word («840/1 Z Bits», «335 Stubby/Vergaserschraubendreher»): 800 / 3800 — Schlitz bits, 840 / 3840 —
// Sechskant bits, 335 / 334 / 3335 / 3334 / 932 / 2035 — slotted screwdrivers; 869 (Steckschlüssel) / 872 (Microstix) — no screw profile of the five
const ser = nm => { const k = (String(nm).match(/^(\d{3,4})(?:\/\d+)?\b/) || [])[1]; return ['800', '3800', '335', '334', '3335', '3334', '932', '2035', '1578'].includes(k) ? 'SL' : ['840', '3840'].includes(k) ? 'HEX' : ['869', '872'].includes(k) ? 'NONE' : null; };
// Kraftform Kompakt VDE inserts carry no profile word: 60 — SL, 62 — PH, 65 — PZ, 67 — TX, 64 — HEX (WERA series numbers)
const serVde = nm => { const k = (String(nm).match(/Kompakt VDE (6\d)/) || [])[1]; return { 60: 'SL', 62: 'PH', 65: 'PZ', 67: 'TX', 64: 'HEX' }[k] || null; };
function wera(size, name, hint) { const s = String(size).replace(/(\d)\.(\d)/g, '$1,$2').replace(/\s+/g, ' ').trim(); const nm = String(name);
  let m; const sk = ser(nm) || serVde(nm);
  // PH / PZ sizes stay strings («PH 00» ≠ «PH 0»); Halfmoon bits «PH 00 x 44 x 1,8 mm» — the length is the first number after the size
  if ((m = s.match(/^(PH|PZ|TX|IP|IPR)\s?(\d+)(?:\s?(BO|IP|IPR))?\s*x\s*([\d,]+)\s*(?:mm|мм|x)/i))) { const p = m[1].toUpperCase(); return { p, n: [/^P[HZ]$/.test(p) ? m[2] : f(m[2])], len: f(m[4]), bo: /BO/i.test(m[3] || '') }; }
  if ((m = s.match(/^(\d+)\s?(IP|IPR)\s*x\s*([\d,]+)\s*(?:mm|мм)/i))) return { p: m[2].toUpperCase(), n: [f(m[1])], len: f(m[3]) };
  if ((m = s.match(/^(PH\/S|PZ\/S)\s?(\d+)\s*x\s*([\d,]+)/i))) return { p: m[1].toUpperCase(), n: [m[2]], len: f(m[3]) };
  // «# 1» of 1550 PH S (WERA: Phillips for mobile phones) is PH, not a square (owner 25.10.2026)
  // PlusMinus: WERA writes the size of PH/S, PZ/S as «# 1» (Kompakt VDE 62 i PH/S, # 1 x 154 мм)
  if ((m = s.match(/^#\s?(\d+)\s*x\s*([\d,]+)/)) && /\b(PH|PZ)\/S\b/.test(nm)) return { p: nm.match(/\b(PH|PZ)\/S\b/)[0], n: [String(+m[1])], len: f(m[2]) };
  if ((m = s.match(/^#\s?(\d+)\s*x\s*([\d,]+)/))) return /PH S\b/.test(nm) ? { p: 'PH', n: [String(+m[1])], len: f(m[2]) } : { p: 'Квадрат', n: [f(m[1])], len: f(m[2]) };
  if ((m = s.match(/^(?:PL|Pentalobe)\s?([\d,]+)\s*x\s*([\d,]+)/i))) return { p: 'Pentalobe', n: [f(m[1])], len: f(m[2]) };
  if ((m = s.match(/^([\d,]+)\s*(?:mm|мм)?\s*x\s*([\d,]+)\s*(?:mm|мм)?\s*x\s*([\d,]+)\s*(?:mm|мм)/i)) && (sk === 'SL' || !sk && /schlitz|шлиц|плоск|SL\b|Elektrikerklinge|Werkstattklinge/i.test(nm))) return { p: 'SL', n: [f(m[1]), f(m[2])], len: f(m[3]) };
  if ((m = s.match(/^([\d,]+|\d+\/\d+)\s*(?:mm|мм|")?\s*x\s*([\d,]+)\s*(?:mm|мм)/i)) && (sk === 'HEX' || !sk && /sechskant|hex|шестигран/i.test(nm))) return { p: 'HEX', n: [frac(m[1])], len: f(m[2]), inch: /\//.test(m[1]) };
  if ((m = s.match(/^(TX)\s?(\d+)/i))) return { p: 'TX', n: [f(m[2])], len: null };
  // no profile word in the WERA name (Stubby «для карбюраторов», socket screwdrivers 395 / 495, 391): the numbers only, the profile = our hint
  if (hint && (m = s.match(/^([\d,]+)\s*(?:mm|мм)?\s*x\s*([\d,]+)\s*(?:mm|мм)?\s*x\s*([\d,]+)\s*(?:mm|мм)/i)) && hint === 'SL') return { p: 'SL', n: [f(m[1]), f(m[2])], len: f(m[3]), hinted: true };
  if (hint === 'Microstix®' && (m = s.match(/^([A-Za-z]+|\d+)\s*x\s*([\d,]+)\s*(?:mm|мм)/))) return { p: hint, n: [/^\d+$/.test(m[1]) ? f(m[1]) : m[1]], len: f(m[2]), hinted: true };
  if (hint && (m = s.match(/^([\d,]+|\d+\/\d+)\s*(?:mm|мм|")?\s*x\s*([\d,]+)\s*(?:mm|мм)/i))) return { p: hint, n: [frac(m[1])], len: f(m[2]), inch: /\//.test(m[1]), hinted: true };
  return null; }
// the size part of a datasheet title: the last «, …» segment with a digit
const dsSize = t => { const parts = String(t).split(', '); for (let i = parts.length - 1; i > 0; i--) if (/\d/.test(parts[i])) return parts.slice(i).join(', '); return t; };
module.exports = { wera, ours, p1, dsSize }; if (require.main !== module) return;
const res = { size: [], len: [], feat: [], vyd: [], sets: [] };
const row = (a, wp) => { const r = {}; if (wp && wp.table && wp.table.arts.includes(a)) { const k = wp.table.arts.indexOf(a); for (const x of wp.table.rows) r[x.label] = x.vals[k]; } return r; };
// «Produktmerkmale» -> our «Особливості викрутки»; neg — the article's footnote that removes it
const MERK = [[/Sechskantschlüsselhilfe/, 'Допоміжний шестигранник', /Keine Sechskant-Schlüsselhilfe/], [/Sechskantklinge/, 'Шестигранний стрижень', /Keine (?:durchgehende )?Sechskantklinge/],
  [/Haltefunktion/, 'З фіксуючою функцією (HF)', /ohne Haltefunktion/i], [/^ESD/, 'ESD', null], [/^Rostfrei/, 'Нержавіюча сталь', null], [/^Kugelkopf/, 'Кулькова головка', /ohne Kugelkopf/i],
  [/Rapidaptor/, 'Патрон Rapidaptor', null], [/Hohlschaft/, 'Порожнистий стрижень', null], [/Reduzierte[rn]? Klingendurchmesser/, 'Звужений робочий кінець', null]];
// datasheet page 1 (RU) -> the same values; magnet / ring only as the tool's own (CLAUDE.md «Особливості викрутки»)
const DSF = [[/фиксирующ/i, 'З фіксуючою функцією (HF)'], [/\bESD\b|электростатическ/i, 'ESD'], [/нержаве/i, 'Нержавіюча сталь'], [/шаров\S* головк|шарообразн/i, 'Кулькова головка'],
  [/Rapidaptor/, 'Патрон Rapidaptor'], [/полы\S* стерж|полого стерж/i, 'Порожнистий стрижень'], [/Stubby/i, 'Коротка (Stubby)'], [/стопорн\S* кольц/i, 'Зі стопорним кільцем'],
  [/(?<!не|без )магнит/i, 'З магнітом'], [/уменьшенн\S* диаметр|зауженн\S* (?:рабоч|стерж|лезв)/i, 'Звужений робочий кінець'], [/шестигранн\S* (?:стерж|клинк|лезв)/i, 'Шестигранний стрижень'], [/(?:вспомогательн\S* шестигранн|шестигранник\S* под (?:гаечн|ключ)|под гаечный ключ)/i, 'Допоміжний шестигранник']];
const add = (k, p, o) => res[k].push({ art: p.article, name: p.mod_title.ua, link: p.link, ...o });
for (const p of L) { const a = p.article; if (!/^\d{11}$/.test(a)) continue; const D = ds(a); const url = W.art[a]; const wp = url ? W.pages[url] : null; const r = row(a, wp);
  const vyd = ch(p, 'vyd_instrumentu'); const isSet = vyd.some(v => /^Набір|набором/.test(v)); const tool = vyd.includes('Викрутка') || vyd.includes('Змінна вставка');
  const pr = ch(p, 'rozmir_nakonechnyka').map(ours), len = ch(p, ch(p, 'dovzhyna_stryzhnia').length ? 'dovzhyna_stryzhnia' : 'dovzhyna_robochoho_kintsia').map(x => f(x)) /* Діелектричні / Kompakt: «Довжина робочого кінця» */, have = ch(p, 'osoblyvosti_vykrutky'), prof = ch(p, 'profil');
  const hint = pr[0] && pr[0].p; const dsz = D && D.title ? wera(dsSize(D.title), D.title, hint) : null;
  // ---- «Профіль і розмір» — single screwdrivers
  if (!isSet) { let wz = null;
    if (r['Klingendicke'] && r['Klingenbreite']) wz = { p: 'SL', n: [f(r['Klingendicke']), f(r['Klingenbreite'])] };
    else { const ab = r['Abtriebsgröße'] || r['Abtriebsgröße (metrisch)'] || r['Abtriebsgröße Microstix'] || ''; const abi = r['Abtriebsgröße (in Zoll)'] || r['Abtriebsgröße [inch]'] || '';
      let m; if ((m = ab.match(/^(PH|PZ|TX|IP|IPR)\s?(\d+)(?:\s?(BO))?$/))) wz = { p: m[1], n: [/^P[HZ]$/.test(m[1]) ? m[2] : f(m[2])], bo: !!m[3] }; else if ((m = ab.match(/^#\s?(\d+)$/))) wz = pr[0] && /\/S$/.test(pr[0].p) ? { p: pr[0].p, n: [String(+m[1])] } : { p: 'Квадрат', n: [f(m[1])] }; /* «# 1» of PlusMinus = PH/S 1 */
      else if ((m = ab.match(/^PL\s?([\d.,]+)$/))) wz = { p: 'Pentalobe', n: [f(m[1])] }; else if ((m = ab.match(/^(\d+)\s?(IP|IPR)$/))) wz = { p: m[2], n: [f(m[1])] };
      else if (/^[\d,]+$/.test(ab) && prof.some(v => /HEX/.test(v))) wz = { p: 'HEX', n: [f(ab)] }; else if (/^\d+\/\d+"?$/.test(abi.replace('"', '')) && !ab) wz = { p: 'HEX', n: [frac(abi.replace('"', ''))] }; }
    const our = pr[0]; const tag = x => x ? `${x.p} ${x.n.join('×')}` : '—';
    if (tool && !pr.length && (dsz || wz)) add('size', p, { ours: '—', ds: D.title, wde: tag(wz), verdict: 'исправить', why: 'нет «Профіль і розмір»' });
    if (tool && pr.length > 1) add('size', p, { ours: pr.map(x => x.raw).join(' / '), ds: D && D.title, wde: tag(wz), verdict: 'спорно', why: 'два значения у одиночного инструмента' });
    if (tool && our && our.p !== 'Торцева') { const bad = [];
      for (const [src, x] of [['паспорт', dsz], ['wera.de', wz]]) if (x && x.p && x.n) { const pp = x.p === 'IP' && our.p === 'IP' ? true : x.p === our.p; if (!pp || !eq(x.n, our.n)) bad.push(src); }
      if (bad.length) add('size', p, { ours: our.raw, ds: D && D.title, wde: tag(wz), verdict: bad.length === 2 || !(dsz && wz) ? 'исправить' : 'спорно', why: 'не совпадает: ' + bad.join(' + ') }); }
    if (!tool && pr.length) add('size', p, { ours: pr.map(x => x.raw).join(' / '), ds: D && D.title, wde: '', verdict: 'не трогать', why: 'ручка / принадлежность с размерами (вид: ' + vyd.join(', ') + ') — правило 19.10, снимать только по решению владельца (CLAUDE.md)' });
    // ---- «Довжина стрижня»
    const wl = f(r['Gesamtlänge Klinge'] || r['Klingenlänge'] || ''); const dl = dsz && dsz.len;
    if (tool || len.length) { const bad = []; if (len.length > 1) bad.push('два значения');
      if (len.length === 1) { if (dl && Math.abs(dl - len[0]) > 1e-6) bad.push('паспорт ' + dl); if (wl && Math.abs(wl - len[0]) > 1e-6) bad.push('wera.de ' + wl); }
      if (!len.length && (dl || wl)) bad.push('нет у нас');
      if (bad.length) add('len', p, { ours: len.join(' / ') || '—', ds: D && D.title, wde: wl ? `${r['Gesamtlänge Klinge'] ? 'Gesamtlänge Klinge' : 'Klingenlänge'} ${wl}` : '—', verdict: (dl && wl && dl !== wl) ? 'спорно' : 'исправить', why: bad.join('; ') }); } }
  // ---- «Особливості викрутки» (single tools and handles; sets — by composition, below)
  if (!isSet) { const notes = wp && wp.table && wp.table.notes[a] ? wp.table.notes[a].map(n => wp.notesText[n]).filter(Boolean) : []; const src = {};
    if (wp) for (const [re, val, neg] of MERK) { const m = wp.merkmale.find(x => re.test(x)); if (!m || (neg && notes.some(n => neg.test(n)))) continue; (src[val] = src[val] || []).push('wera.de «' + m + '»'); }
    const t = p1(a); for (const [re, val] of DSF) { const m = t.match(new RegExp('[^\\n]{0,60}' + re.source + '[^\\n]{0,60}', re.flags.replace('g', ''))); if (m) (src[val] = src[val] || []).push('паспорт «' + m[0].trim() + '»'); }
    if (D && /\bBO\b/.test(D.title) || r['Abtriebsgröße'] && /BO$/.test(r['Abtriebsgröße'])) (src['З отвором (TX BO)'] = src['З отвором (TX BO)'] || []).push('паспорт / wera.de «BO»');
    // HEX profile: «Sechskantklinge» is the profile itself (owner 24.10: not a feature)
    if (prof.some(v => /^HEX/.test(v))) delete src['Шестигранний стрижень'];
    for (const [val, s] of Object.entries(src)) if (!have.includes(val)) add('feat', p, { value: val, action: 'добавить', src: s.join(' | '), verdict: !tool && !vyd.includes('Ручка-тримач') ? 'не ставить (принадлежность / тримач — правило «Особливості»)' : val === 'З магнітом' ? 'спорно' : 'исправить' });
    for (const val of have) if (!src[val]) add('feat', p, { value: val, action: 'у нас есть, источник не называет', src: wp ? 'wera.de: ' + wp.merkmale.join(', ') : 'нет wera.de', verdict: 'спорно' }); }
  // ---- «Вид» — single tools: the datasheet name
  if (!isSet && D && D.title) { const t = D.title; const isScr = /отв[её]рт?к|торцов\S* ключ для электронщ/i.test(t); // «Отверка» — WERA spelling in 1567 / 1572 / 2072; 2069 «Торцовый ключ для электронщиков» = socket screwdriver
    if (vyd.includes('Викрутка') && !isScr) add('vyd', p, { ours: vyd.join(', '), ds: t, verdict: 'спорно', why: 'вид «Викрутка», в названии паспорта нет «отвертка»' });
    if (!tool && isScr && !/держател|ручк/i.test(t)) add('vyd', p, { ours: vyd.join(', '), ds: t, verdict: 'спорно', why: 'паспорт называет отверткой' });
    if (vyd.length !== 1) add('vyd', p, { ours: vyd.join(', ') || '—', ds: t, verdict: 'спорно', why: vyd.length ? 'два вида' : 'нет вида' }); }
  // ---- sets: «… у складі» against wera.de «Werkzeuge in diesem Set» (no page — the datasheet composition)
  // a row with a WERA article: the component's own datasheet name (RU, with the profile word) — VDE inserts «Kraftform Kompakt VDE 64 i, 2,5 x 157» carry none (25.10.2026)
  const cname = (x, n) => { if (x.art) { try { const t = ds(x.art).title; if (t) return t; } catch { } } return n; };
  if (isSet) { const rows = wp && wp.setItems.length ? wp.setItems.flatMap(i => i.rows.map(x => ({ size: x.size, name: cname(x, i.name), qty: x.qty }))) : (COMP[a] || []).flatMap(g => g.items.map(x => ({ size: x.size, name: cname(x, g.head), qty: x.qty })));
    const srcName = wp && wp.setItems.length ? 'wera.de' : COMP[a] ? 'паспорт' : null; if (!srcName) { add('sets', p, { key: '—', ours: '', wera: '', verdict: 'спорно', why: 'нет состава ни в паспорте, ни на wera.de' }); continue; }
    const want = { sklad_ph: new Set(), sklad_pz: new Set(), sklad_tx: new Set(), sklad_sl: new Set(), sklad_hex: new Set(), sklad_kvadrat: new Set(), sklad_tx_bo: new Set(), sklad_plusminus: new Set() }; const unread = [];
    const n1 = x => (Number.isInteger(x) ? x + ',0' : String(x).replace('.', ','));
    for (const x of rows) { const w = wera(x.size, x.name); if (!w) { if (/\d/.test(x.size) && ser(x.name) !== 'NONE' && !/Microstix|Steckschlüssel|Торцов\S* головк|Ausheber|Adapter|Reifenheber|klett|ложемент|rack|leiste|tasche|сумк|держател|планк|подставк|ручка|handhalter|griff/i.test(x.name)) unread.push(x.name + ' «' + x.size + '»'); continue; }
      if (w.p === 'PH') want.sklad_ph.add('PH ' + w.n[0]); if (/^P[HZ]\/S$/.test(w.p)) want.sklad_plusminus.add(w.p + ' ' + w.n[0]); if (w.p === 'PZ') want.sklad_pz.add('PZ ' + w.n[0]); if (w.p === 'TX') { want.sklad_tx.add('TX ' + w.n[0]); if (w.bo || /BO\b/.test(x.name)) want.sklad_tx_bo.add('TX BO ' + w.n[0]); }
      if (w.p === 'SL') want.sklad_sl.add(`SL ${String(w.n[0]).replace('.', ',')}×${n1(w.n[1])}`); if (w.p === 'HEX') want.sklad_hex.add(w.inch ? 'HEX ' + (String(x.size).match(/^\d+\/\d+/) || [''])[0] + '″' : 'HEX ' + n1(w.n[0])); if (w.p === 'Квадрат') want.sklad_kvadrat.add('Квадрат #' + w.n[0]); }
    const key = v => v.replace(/(\d),(\d*?)0+(?=×|$)/g, '$1,$2').replace(/,(?=×|$)/g, '');
    for (const k of Object.keys(want)) { const o = ch(p, k).map(key).filter(v => !/не вказано/.test(v)), w = [...want[k]].map(key); const miss = w.filter(v => !o.includes(v)), extra = o.filter(v => !w.includes(v));
      if (miss.length || extra.length) add('sets', p, { key: k, ours: ch(p, k).join(', '), wera: [...want[k]].join(', '), verdict: unread.length ? 'спорно' : 'исправить', why: (miss.length ? 'нет у нас: ' + miss.join(', ') : '') + (extra.length ? (miss.length ? '; ' : '') + 'у нас лишнее: ' + extra.join(', ') : '') + ' (источник: ' + srcName + ')' + (unread.length ? '; не разобрано: ' + unread.join('; ') : '') }); } } }
fs.writeFileSync(out + '.json', JSON.stringify({ at: new Date().toISOString(), visible: L.length, ...res }, null, 1));
const wb = X.utils.book_new(); const NAMES = { size: 'Профіль і розмір', len: 'Довжина стрижня', feat: 'Особливості', vyd: 'Вид', sets: 'Набори у складі' };
for (const k of Object.keys(res)) X.utils.book_append_sheet(wb, X.utils.json_to_sheet(res[k].length ? res[k] : [{ art: 'расхождений нет' }]), NAMES[k]);
X.writeFile(wb, out + '.xlsx'); console.log('visible', L.length, Object.entries(res).map(([k, v]) => `${k} ${v.length} (исправить ${v.filter(x => x.verdict === 'исправить').length})`).join(' | '));
