// Group «Діелектричні інструменти» (1224): values from section, series table row, title, datasheets.
// Reused: vyd_instrumentu, profil, pryvid, osoblyvosti_vykrutky. New: rozmir_robochoho_kintsia, dovzhyna_robochoho_kintsia.
const fs = require('fs'), path = require('path');
const I = require('./1224_items.json');
const PROFSEC = { 1226: 'PHS', 1227: 'PZS', 1228: 'TX', 1229: 'SQ', 1233: 'PH', 1234: 'PZ', 1235: 'HEX', 1236: 'SL', 1238: 'TX', 1243: 'TX', 1244: 'PHS', 1245: 'PZS', 1248: 'NUT', 1249: 'PH', 1250: 'PH', 1251: 'PZ', 1252: 'PZ', 1253: 'SQ', 1255: 'SL', 1256: 'SL', 1241: 'SL',
  1260: 'TX', 1261: 'XZN', 1262: 'HEX', 1265: 'NUT', 1450: 'NUT', 1451: 'HEX', 1452: 'TX' };
const PROF = { TX: 'TX (TORX®)', PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', PHS: 'PlusMinus (PH/PZ + шліц)', PZS: 'PlusMinus (PH/PZ + шліц)', SL: 'SL (шліц)', HEX: 'HEX (шестигранник)', SQ: 'Квадрат (Robertson)', NUT: 'Торцева головка (зовнішній шестигранник)', XZN: 'XZN (багатозубцевий)',
  CSQ: 'Внутрішній квадрат (шафовий)', TRI: 'Тригранник (шафовий)', DB: 'Подвійна борідка (шафова)' };
const ZYK = [1260, 1261, 1262, 1263, 1264, 1265, 1266, 1450, 1451, 1452, 1453, 1454, 1456];
const num = s => String(s).replace('.', ',').trim(); const dec = v => (/,/.test(v) ? v : v + ',0');
const norm = s => s.replace(/(\d), (\d)/g, '$1,$2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/(\d|″)\s*[хХ×]\s*(?=\d)/g, '$1x').replace(/ x /g, 'x');
function profileOf(n, s) { if (/подвійна борідка/i.test(n)) return 'DB'; if (/тригранник/i.test(n)) return 'TRI'; if (/внутрішній квадрат \d/i.test(n)) return 'CSQ';
  if (/PH\/S/.test(n)) return 'PHS'; if (/PZ\/S/.test(n)) return 'PZS'; if (PROFSEC[s]) return PROFSEC[s];
  if (/\bTX ?\d|TORX/.test(n)) return 'TX'; if (/\bPH ?\d/.test(n)) return 'PH'; if (/\bPZ ?\d/.test(n)) return 'PZ'; if (/\bSL ?\d|шлиц|шліц/i.test(n)) return 'SL'; if (/HEX|шестигран/i.test(n)) return 'HEX'; if (/#\d/.test(n)) return 'SQ'; return null; }
function size(it, p) { const r = it.row || {}; const n = norm(it.title); let m; const pr = r['Профіль'] && String(r['Профіль']);
  if (p === 'TX') { m = (pr && pr.match(/TX ?(\d+)/)) || n.match(/TX ?(\d+)/) || n.match(/TORX (\d+)/); return m ? m[1] : null; }
  if (p === 'PH' || p === 'PZ') { m = (pr && pr.match(/(?:PH|PZ) ?(\d)/)) || n.match(/(?:PH|PZ) ?(\d)(?![\d,])/); return m ? m[1] : null; }
  if (p === 'PHS' || p === 'PZS') { m = n.match(/(?:PH|PZ)\/S ?#?(\d)/); return m ? m[1] : null; }
  if (p === 'SQ') { m = n.match(/# ?(\d)/); return m ? m[1] : null; }
  if (p === 'XZN') { m = n.match(/XZN (M\d+)/); return m ? m[1] : null; }
  if (p === 'SL') { const w = r['Ширина робочого кінця мм']; if (w && w !== '-') return dec(num(w)); m = n.match(/SL ?(\d+,\d+)x(\d+,\d+)x\d/); if (m) return dec(m[2]); m = n.match(/SL ?(\d+(?:,\d+)?)x/); return m ? dec(m[1]) : null; }
  if (p === 'HEX') { const a = r['Розмір мм']; if (a && a !== '-') return dec(num(a)); m = n.match(/HEX ?(\d+(?:,\d+)?)/) || n.match(/шестигранник (\d+(?:,\d+)?) мм/) || n.match(/HF (\d+(?:,\d+)?) мм/); return m ? dec(m[1]) : null; }
  if (p === 'NUT') { const a = r['Розмір мм']; if (a && a !== '-') return num(a).replace(/,0$/, '') + ' мм'; const b = r['Розмір дюйми']; if (b && b !== '-') return String(b).replace(/["”″]/g, '') + '″'; m = n.match(/дюймова[^\d]*(\d+\/\d+)″/); if (m) return m[1] + '″'; m = n.match(/(\d+(?:,\d+)?) мм, привід|привід \d\/\d″?, (\d+(?:,\d+)?) мм|(\d+(?:,\d+)?)x\d+ мм/); const v = m && (m[1] || m[2] || m[3]); return v ? num(v).replace(/,0$/, '') + ' мм' : null; }
  if (p === 'CSQ' || p === 'TRI' || p === 'DB') { m = n.match(/(\d+(?:,\d+)?) мм/); return m ? num(m[1]) + ' мм' : null; } // WERA datasheets 98 DK / 99 FL give no size
  return null; }
function length(it) { const r = it.row || {}; const L = r['Довжина робочого кінця мм'] || r['Загальна довжина мм']; if (L && L !== '-') return num(L).replace(/,0$/, '') + ' мм';
  const n = norm(it.title); let m = n.match(/x ?(\d+(?:,\d+)?) ?мм(?!.*x ?\d+ ?мм)/) || n.match(/x(\d{2,3})$/); if (m) return m[1] + ' мм';
  const f = path.join(__dirname, '../batch/ds', it.a + '.txt'); if (fs.existsSync(f)) { m = fs.readFileSync(f, 'utf8').split('\n')[0].match(/(?:x|,) (\d+) мм\s*$/); if (m) return m[1] + ' мм'; } return null; }
function drive(n) { const d = []; if (/1\/4|¼/.test(n)) d.push('квадрат 1/4″'); if (/3\/8|⅜/.test(n)) d.push('квадрат 3/8″'); return d; }
const out = [], disputed = [];
for (const it of I) { const s = it.secs[0], n = it.title, nn = norm(n); let vyd, kind = null;
  // owner 21.10.2026: a set «Набір ізольованих викруток … + індикатор напруги» is a set of screwdrivers, not a voltage indicator (WERA: «Набор отвёрток … + тестер»)
  if (/індикатор напруги/i.test(n) && !/^Набір/i.test(n)) vyd = 'Індикатор напруги';
  else if (/Joker/i.test(n) && /ріжков/i.test(n)) vyd = /^Набір/i.test(n) ? 'Набір ключів' : 'Ріжковий ключ';
  else if (/^Набір|набір|\bSet\b|у наборі/i.test(n) || [1230, 1239, 1246, 1263].includes(s)) vyd = /^Пояс/i.test(n) ? 'Приладдя' : (ZYK.includes(s) ? 'Набір головок' : 'Набір викруток');
  // owner 22.10.2026 (docs/fill_gaps.md item 6): a torque handle (7440 / 7441 / 7444 VDE, 7508 / 7516 VDE) is a «Динамометрична викрутка» only — the kind by the main function
  else if (/динамометр/i.test(n)) vyd = 'Динамометрична викрутка';
  else if (/ручка-тримач|викрутка-тримач|ручка з тріскачкою|Т-подібна ізольована ручка/i.test(n) || s === 1231) vyd = 'Ручка-тримач';
  else if (/подовжувач|адаптер|перехідник|Пояс/i.test(n) || [1264, 1453].includes(s)) vyd = 'Приладдя';
  else if (/тріскачка/i.test(n) || [1266, 1456].includes(s)) vyd = 'Тріскачка';
  else if (/торцева/i.test(n) && ZYK.includes(s)) { vyd = 'Торцева головка'; kind = 'head'; }
  else if (/викрутк\S* головк|викруткова головка/i.test(n)) { vyd = 'Викруткова головка'; kind = 'head'; }
  else if (/вставка|насадка/i.test(n) || (s >= 1226 && s <= 1236)) { vyd = 'Змінна вставка'; kind = 'blade'; }
  else { vyd = 'Викрутка'; kind = 'blade'; }
  const v = { a: it.a, title: n, secs: it.secs, sec: s, kind, vyd: [vyd], profile: [], size: [], len: [], drv: [], feat: [] };
  if (kind) { const p = profileOf(nn, s); if (p) { v.profile = [PROF[p]]; const z = size(it, p); if (z) v.size = [z]; else disputed.push({ a: it.a, sec: s, what: 'Розмір робочого кінця', why: 'нет в таблице и названии', title: n }); }
    else disputed.push({ a: it.a, sec: s, what: 'Профіль', why: 'не определён', title: n });
    if (kind === 'blade') { const L = length(it); if (L) v.len = [L]; else disputed.push({ a: it.a, sec: s, what: 'Довжина робочого кінця', why: 'нет в таблице и названии', title: n }); } }
  if (vyd === 'Ріжковий ключ') { const m = nn.match(/(\d+)-(\d+) мм/); if (m) v.size = [`${m[1]}–${m[2]} мм`]; }
  if (ZYK.includes(s) || /410 i VDE/.test(n)) v.drv = drive(n);
  // owner 22.10.2026 (docs/fill_gaps.md): handles for Kraftform Kompakt VDE blades («Исключительно для сменных отверток VDE») — the drive like the torque handles
  else if (s === 1231 && vyd === 'Ручка-тримач') v.drv = ['Kraftform Kompakt VDE (вставки)'];
  if (/звужен|завужен|extra slim/i.test(n)) v.feat.push('Звужений робочий кінець'); if (/нержав/i.test(n)) v.feat.push('Нержавіюча сталь');   // night 20.10.2026: name + WERA datasheet (night_vde2.js) if (/фіксуюч|\bHF\b/i.test(n)) v.feat.push('З фіксуючою функцією (HF)');
  out.push(v); }
module.exports = { out, disputed };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; };
  console.log('items', out.length, 'disputed', disputed.length); for (const k of ['vyd', 'profile', 'drv', 'feat']) console.log(k, c(k)); const { cmp } = require('../lib/valsort.js');
  console.log('size', Object.keys(c('size')).sort(cmp).join(' · ')); console.log('len', Object.keys(c('len')).sort(cmp).join(' · ')); console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 90)}`).join('\n')); }
