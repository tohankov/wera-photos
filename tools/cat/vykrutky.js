// Group «Викрутки» (1098): values from section, series table row, title. Reused: vyd_instrumentu, profil. New: rozmir_nakonechnyka, dovzhyna_stryzhnia, osoblyvosti_vykrutky.
const I = require('./1098_items.json');
const PROFSEC = { 1101: 'TX', 1116: 'TX', 1121: 'TX', 1128: 'TX', 1136: 'TX', 1145: 'TX', 1144: 'TXBO', 1102: 'TW', 1103: 'SQ', 1122: 'SQ', 1106: 'NUT', 1131: 'NUT', 1139: 'NUT', 1149: 'NUT',
  1107: 'PH', 1108: 'PH', 1117: 'PH', 1124: 'PH', 1132: 'PH', 1150: 'PH', 1151: 'SL', 1109: 'PZ', 1110: 'PZ', 1118: 'PZ', 1125: 'PZ', 1111: 'HEX', 1133: 'HEX', 1140: 'HEX', 1141: 'HEX', 1112: 'SL', 1113: 'SL', 1119: 'SL', 1126: 'SL', 1134: 'SL' };
const SETS = [1099, 1105, 1115, 1123, 1129, 1137, 1146], HOLD = [1138, 1147], ACC = [1142];
const PROF = { TX: 'TX (TORX®)', TXBO: 'TX BO (TORX® з отвором)', TW: 'TRI-WING®', SQ: 'Квадрат (Robertson)', NUT: 'Торцева головка (зовнішній шестигранник)', PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', HEX: 'HEX (шестигранник)', SL: 'SL (шліц)', IPR: 'IPR (TORX PLUS® IPR)', IP: 'IP (TORX PLUS®)', MS: 'Microstix®', PL: 'Pentalobe' };
const t = require('../sections/tree_now.json'); const nameOf = Object.fromEntries(t.map(p => [p.id, p.title.ua]));
const num = s => String(s).replace('.', ',').trim(); const dec = v => (/,/.test(v) ? v : v + ',0'); const inch = s => String(s).replace(/["”″\s]+$/g, '').replace(/["”″]/g, '').trim() + '″';
const norm = s => s.replace(/(\d), (\d)/g, '$1,$2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/[хХ×]/g, 'x');
const fs = require('fs'), path = require('path'); const dsTitle = it => { const f = path.join(__dirname, '../batch/ds', it.a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n')[0] : ''; };
function profileOf(it) { const n = norm(it.title), s = it.secs[0];
  if (/Pentalobe/i.test(n)) return 'PL'; if (/Microstix/i.test(n)) return 'MS'; if (/IPR/.test(n)) return 'IPR'; if (/TORX PLUS/.test(n)) return 'IP';
  // owner 21.10.2026: 2055 PZ / 1555 PZ ESD sit in the «Хрестові» (PH) sections — the title and the WERA datasheet say PZ
  if (PROFSEC[s]) { if (PROFSEC[s] === 'TX' && /\bBO\b/.test(n)) return 'TXBO'; if (PROFSEC[s] === 'PH' && /\bPZ ?\d/.test(n)) return 'PZ'; return PROFSEC[s]; }
  if (/\bTX ?\d/.test(n)) return /\bBO\b/.test(n) ? 'TXBO' : 'TX'; if (/\bPH ?\d/.test(n)) return 'PH'; if (/\bPZ ?\d/.test(n)) return 'PZ'; if (/\bSL ?\d/.test(n) || /шліцев|шлицев/i.test(n)) return 'SL'; if (/HEX|шестигранн/i.test(n)) return 'HEX'; if (/квадрат/i.test(n) && /#/.test(n)) return 'SQ'; return null; }
function size(it, p) { const r = it.row || {}; const n = norm(it.title); let m;
  const pr = r['Профіль'] && String(r['Профіль']);
  if (p === 'TX' || p === 'TXBO') { m = (pr && pr.match(/TX ?(\d+)/)) || n.match(/TX ?(\d+)/); return m ? m[1] : null; }
  if (p === 'IPR' || p === 'IP') { m = (pr && pr.match(/(\d+) ?IPR?/)) || n.match(/(\d+) ?(?:IPR|IP)(?=x| |$)/) || n.match(/IPR? ?(\d+)/) || dsTitle(it).match(/, (\d+) IPR? x/); return m ? m[1] : null; }
  if (p === 'PH' || p === 'PZ') { m = (pr && pr.match(/(?:PH|PZ) ?(\d+)/)) || n.match(/(?:PH|PZ) ?(\d{1,3})(?![\d,])/); return m ? m[1] : null; }
  if (p === 'SQ') { m = n.match(/# ?(\d{1,2})/); return m ? m[1] : null; }
  if (p === 'TW') { m = n.match(/375 (\d)x/) || n.match(/TRI-WING® ?(\d)/); return m ? m[1] : null; }
  if (p === 'SL') { const w = r['Ширина робочого кінця мм']; if (w && w !== '-') return dec(num(w)); m = n.match(/(\d+,\d+)x(\d+,\d+)x\d+/); if (m) return dec(m[2]); m = n.match(/SL ?(\d+(?:,\d+)?)x/); return m ? dec(m[1]) : null; }
  if (p === 'HEX') { const a = r['Розмір мм'] || r['Профіль мм'] || (pr && /^\d/.test(pr) ? pr : null), b = r['Розмір дюйми']; if (a && a !== '-') return dec(num(String(a).replace(/[^\d.,]/g, ''))); if (b && b !== '-') return inch(b);
    m = n.match(/HEX ?(\d+\/\d+)″/) || n.match(/(\d+\/\d+)″ ?x/); if (m) return m[1] + '″'; m = n.match(/HEX ?(\d+(?:,\d+)?)/) || n.match(/(?:функцією|Plus|ручкою|головкою) (\d+(?:,\d+)?)x\d/); return m ? dec(m[1]) : null; }
  if (p === 'NUT') { const a = r['Профіль мм'] || r['Розмір мм'], b = r['Розмір дюйми']; if (a && a !== '-') return num(a).replace(/,0$/, '') + ' мм'; if (b && b !== '-') return inch(b);
    m = n.match(/(\d+\/\d+)″ ?x/); if (m) return m[1] + '″'; m = n.match(/ (\d+(?:,\d+)?)x\d+ мм/); return m ? num(m[1]).replace(/,0$/, '') + ' мм' : null; }
  if (p === 'MS') { m = n.match(/(\d{1,2}|F|m)x4\d/) || dsTitle(it).match(/, (\d{1,2}|F|m) x \d+ мм/); return m ? m[1] : null; }
  if (p === 'PL') { m = n.match(/PL ?(\d+)/); return m ? m[1] : null; }
  return null; }
function length(it) { const r = it.row || {}; const L = r['Довжина робочого кінця мм']; if (L && L !== '-') return num(L).replace(/,0$/, '') + ' мм';
  const n = norm(it.title); const m = n.match(/x ?(\d+(?:,\d+)?) ?мм(?!.*x ?\d+ ?мм)/) || n.match(/#\d+x(\d+)(?: |$)/) || dsTitle(it).match(/ x (\d+(?:\.\d+)?) мм\s*$/); return m ? num(m[1]).replace(/,0$/, '') + ' мм' : null; }
function features(it) { const n = it.title; const f = [];
  if (/фіксуюч|\bHF\b/i.test(n)) f.push('З фіксуючою функцією (HF)'); if (/шестигранним стрижнем|шестигранний стрижень/i.test(n)) f.push('Шестигранний стрижень'); if (/допоміжним шестигранником/i.test(n)) f.push('Допоміжний шестигранник');
  if (/кульков/i.test(n)) f.push('Кулькова головка'); if (/Stubby|коротк/i.test(n)) f.push('Коротка (Stubby)'); if (/Lasertip/i.test(n)) f.push('Наконечник Lasertip'); if (/порожн/i.test(n)) f.push('Порожнистий стрижень'); return f; }
const out = [], disputed = [];
for (const it of I) { const s = it.secs[0], n = it.title; let vyd, p = null;
  if (/^(?:Коротка )?ручка-(?:тримач|б[іi]т)/i.test(n) && !/набор|набір/i.test(n)) vyd = 'Ручка-тримач';
  else if (SETS.includes(s) || /^Набір|набір викруток|з набором (біт|насадок)/i.test(n)) vyd = 'Набір викруток';
  else if (HOLD.includes(s) || /ручка-б[іi]т|ручка-тримач|бітоутримувач|бітотримач/i.test(n)) vyd = 'Ручка-тримач';
  else if (ACC.includes(s) || /знімач|намагніч|фіксатор|підставка|лопат/i.test(n)) vyd = 'Приладдя для викруток';
  else { vyd = 'Викрутка'; p = profileOf(it); }
  const v = { a: it.a, title: n, secs: it.secs, sec: s, vyd: [vyd], kind: vyd === 'Викрутка', profile: p ? [PROF[p]] : [], size: [], len: [], feat: vyd === 'Викрутка' ? features(it) : [] };
  if (v.kind) { const sz = p && size(it, p), L = length(it); if (sz) v.size = [sz]; if (L) v.len = [L];
    if (!p) disputed.push({ a: it.a, sec: s, what: 'Профіль', why: 'не определён по разделу/названию', title: n }); else if (!sz) disputed.push({ a: it.a, sec: s, what: 'Розмір наконечника', why: 'нет в таблице и названии', title: n });
    if (!L) disputed.push({ a: it.a, sec: s, what: 'Довжина стрижня', why: 'нет в таблице и названии', title: n }); }
  out.push(v); }
module.exports = { out, disputed, nameOf };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; };
  console.log('items', out.length, 'screwdrivers', out.filter(v => v.kind).length, 'disputed', disputed.length); console.log(c('vyd'), c('profile'), c('feat'));
  console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 80)}`).join('\n')); }
