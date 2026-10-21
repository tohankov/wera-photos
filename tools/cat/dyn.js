// Group «Динамометричний інструмент» (1195): values from section, series table row, title, WERA datasheet title (batch/ds).
// Reused: vyd_instrumentu, profil, pryvid, rozmir_nakonechnyka. New: diapazon_momentu, nalashtuvannia_momentu, typ_nasadky, rozmir_nasadky, osoblyvosti_dynamometra.
const fs = require('fs'), path = require('path');
const I = require('./1195_items.json');
const dsTitle = it => { const f = path.join(__dirname, '../batch/ds', it.a + '.txt'); if (!fs.existsSync(f)) return ''; const L = fs.readFileSync(f, 'utf8').split('\n').map(s => s.replace(/^p\d /, '')); const k = L.findIndex(s => /^EAN:/.test(s)); return L.slice(0, k > 0 ? k : 2).join(' '); };
const dsText = it => { const f = path.join(__dirname, '../batch/ds', it.a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const norm = s => s.replace(/​/g, '').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/(\d|″)\s*[хХ×]\s*(?=\d)/g, '$1x');
const f = s => +String(s).replace(',', '.');
const INLB = 0.113; // 1 in·lb = 0,113 N·m
const NUM = '(\\d+(?:,\\d+)?)';
const TQX = require('./torque_exact.json').products;
const fmt = x => String(Math.round(x * 1000) / 1000).replace('.', ',');
// a range computed by torque() (N·m; in·lb converted) back to the WERA unit: «0,3–1,2 Н·м», «25–55 in·lb», an indicator «3 Н·м»
const exact = ([lo, hi], n) => { const inlb = /дюйм фунт|in·lb/i.test(n); const k = inlb ? INLB : 1, u = inlb ? 'in·lb' : 'Н·м'; return lo === hi ? `${fmt(lo / k)} ${u}` : `${fmt(lo / k)}–${fmt(hi / k)} ${u}`; };
// «Особливості динамометра» from the WERA datasheet (owner 22.10.2026): «для правой и левой затяжки / резьбы» -> «Для правої та лівої різьби»,
// «ручка пистолетной формы» -> «Пістолетна ручка». Torque Lock of Safe-Torque (unlimited torque position) is NOT «Функція Torque Lock» (Click-Torque Lock: locked setting)
const RL = /правой и левой (затяжк|резьб)/i, PG = /ручка пистолетной формы/i;
const dsFlat = it => dsText(it).replace(/^p\d+ /gm, '').replace(/ \| /g, ' ').replace(/\s+/g, ' ');
function torque(it, n) { const r = it.row || {}; const inlb = /дюйм фунт|in·lb/i.test(n) || Object.keys(r).some(k => /in·lb/.test(k)); const k = inlb ? INLB : 1;
  const sc = Object.entries(r).find(([h]) => /Основна шкала/.test(h)); if (sc && /-/.test(sc[1])) { const [a, b] = String(sc[1]).split('-'); return [f(a) * k, f(b) * k]; }
  let m = n.match(new RegExp(NUM + ' ?[–-] ?' + NUM + ' ?(?:Нм|Nm|Н·м|дюйм)')); if (m) return [f(m[1]) * k, f(m[2]) * k];
  const t = norm(dsTitle(it)); m = t.match(new RegExp(NUM + ' ?[-–] ?' + NUM + ' ?(?:Нм|Nm|нм|in·lbs?|дюйм)', 'i')); if (m) return [f(m[1]) * (/in·lb|дюйм/i.test(m[0]) ? INLB : 1), f(m[2]) * (/in·lb|дюйм/i.test(m[0]) ? INLB : 1)];
  const pre = Object.entries(r).find(([h]) => /Попередньо встановлене/.test(h)); if (pre) return [f(pre[1]) * k, f(pre[1]) * k];
  m = n.match(new RegExp(NUM + ' ?(?:Нм|Nm|Н·м|дюйм)')); if (m) return [f(m[1]) * k, f(m[1]) * k];
  const d = norm(dsText(it)).replace(/\s*\n\s*p\d /g, ' ');
  m = d.match(/Диапазон (?:измерения|значений):? ?(\d+(?:,\d+)?) ?- ?(\d+(?:,\d+)?) ?(Nm|Нм|in·lbs?)/i); if (m) return [f(m[1]) * (/in/.test(m[3]) ? INLB : 1), f(m[2]) * (/in/.test(m[3]) ? INLB : 1)];
  m = d.match(/от (\d+(?:,\d+)?) до (\d+(?:,\d+)?) Нм/); if (m) return [f(m[1]), f(m[2])];
  m = d.match(/\(((?:\d+,\d+; ?)+\d+,\d+) Нм\)/); if (m) { const xs = m[1].split(/; ?/).map(f); return [Math.min(...xs), Math.max(...xs)]; }
  return null; }
function drives(n, t) { const s = n + ' ' + t, d = [];
  if (/під біту|под биту|for bits/i.test(s)) d.push('шестигранник 1/4″');
  else { const q = s.match(/(?:квадрат\S*|квадратн\S* приєднувальн\S*|Push R\/L|ключ|reverse|Click-Torque [A-E] ?\d[^,]*?)\s*(1\/4|3\/8|1\/2|3\/4)″/i) || s.match(/(?:^|\s)(1\/4|3\/8|1\/2|3\/4)″ (?:Click-Torque|x)/); if (q) d.push('квадрат ' + q[1] + '″'); }
  if (/9x12/.test(s)) d.push('9×12 мм (змінні насадки)'); if (/14x18/.test(s)) d.push('14×18 мм (змінні насадки)'); return [...new Set(d)]; }
const NAS = { 1210: 'Ріжковий ключ Joker (самоналаштування)', 1211: 'TORX®', 1212: 'TORX®', 1213: 'Накидний ключ з прорізом', 1214: 'Накидний ключ', 1215: 'Накидний ключ', 1216: 'Ріжковий ключ', 1217: 'Ріжковий ключ', 1218: 'Для зварювання', 1219: 'З квадратом', 1220: 'Адаптер' };
const KEYS = [1197, 1221, 1222, 1223, 1464], DRV = [1199, 1200, 1202, 1204, 1205, 1206, 1207];
const out = [], disputed = [];
for (const it of I) { const s = it.secs[0], n = norm(it.title), t = norm(dsTitle(it)); let vyd, kind = null;
  if (s === 1196) { vyd = 'Індикатор крутного моменту'; kind = 'ind'; }
  else if (s === 1465) vyd = 'Ремкомплект / запчастина';
  else if (s === 1458) vyd = 'Ручка-вороток';
  else if (NAS[s]) { vyd = 'Змінна насадка'; kind = 'nas'; }
  else if (/рекалібр/i.test(n)) vyd = 'Приладдя';
  else if (s === 1208 || s === 1230 || /набір|Set \d/i.test(n)) vyd = 'Набір з динамометричним інструментом';
  else if (KEYS.includes(s)) { vyd = 'Динамометричний ключ'; kind = 'key'; }
  else if (DRV.includes(s)) { vyd = 'Динамометрична викрутка'; kind = 'drv'; }
  else vyd = 'Приладдя';
  const v = { a: it.a, title: it.title, secs: it.secs, sec: s, kind, vyd: [vyd], torque: [], set: [], drv: [], nas: [], nsize: [], profile: [], tip: [], feat: [] };
  // «Діапазон моменту» = the exact WERA range (owner 22.10.2026, вариант (а)): cat/torque_exact.json; a new product — its range from the table / name / datasheet
  if (kind === 'ind' || kind === 'key' || kind === 'drv' || vyd.startsWith('Набір')) { const q = TQX[it.a] ? null : torque(it, n);
    if (TQX[it.a]) v.torque = TQX[it.a].vals; else if (q) v.torque = [exact(q, n)]; else if (kind) disputed.push({ a: it.a, sec: s, what: 'Діапазон моменту', why: 'нет в таблице, названии и datasheet', title: it.title }); }
  if (kind && (kind === 'ind' || [1204, 1205, 1206].includes(s) || s === 1464)) v.set = ['Встановлений (фіксований)']; else if (kind === 'key' || kind === 'drv') v.set = ['Регульований'];
  if (kind === 'key' || s === 1458) v.drv = drives(n, t);
  if (kind === 'drv') v.drv = [1199, 1205].includes(s) ? ['Halfmoon / HIOS 4 мм'] : (s === 1202 || /VDE/.test(n)) ? ['Kraftform Kompakt VDE (вставки)'] : ['шестигранник 1/4″'];
  if (kind === 'nas') { v.nas = [NAS[s]]; if (s === 1219 && /тріскачк|тремтіння|реверс/i.test(n)) v.nas = ['Тріскачка з квадратом'];
    v.drv = drives(n, t).filter(d => /змінні насадки/.test(d)); if (!v.drv.length) disputed.push({ a: it.a, sec: s, what: 'Привід', why: 'нет в названии и datasheet', title: it.title });
    const r = it.row || {}; let m;
    if (s === 1211 || s === 1212) { m = n.match(/TX ?(\d+)/); if (m) v.nsize = ['TX ' + m[1]]; }
    else if (s === 1210 || /Joker/.test(n)) { m = n.match(/(\d+)-(\d+) мм/); if (m) v.nsize = [`${m[1]}–${m[2]} мм`]; }
    else if (r['Розмір ключа мм']) v.nsize = [String(r['Розмір ключа мм']).replace('.', ',') + ' мм'];
    else if ([1213, 1214, 1215, 1216, 1217].includes(s)) { m = n.match(/ключ (\d+) мм/); if (m) v.nsize = [m[1] + ' мм']; }
    if ([1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217].includes(s) && !v.nsize.length) disputed.push({ a: it.a, sec: s, what: 'Розмір насадки', why: 'нет в таблице и названии', title: it.title }); }
  if (kind === 'ind') { let m; const pr = String((it.row || {})['Профіль'] || '');
    if (/TORX PLUS|IP\b/.test(n)) { v.profile = ['IP (TORX PLUS®)']; m = n.match(/(\d+) IP/); }
    else if (/\bTX ?\d/.test(n)) { v.profile = ['TX (TORX®)']; m = n.match(/TX ?(\d+)/); }
    else if (/HEX/.test(n)) { v.profile = ['HEX (шестигранник)']; m = n.match(/HEX (\d+,\d)/) || pr.match(/(\d+,\d)/); }
    if (m) v.tip = [m[1]]; else disputed.push({ a: it.a, sec: s, what: 'Розмір наконечника', why: 'нет в таблице и названии', title: it.title }); }
  if (/\bESD\b/.test(n)) v.feat.push('ESD'); if (/VDE/.test(n)) v.feat.push('VDE (ізольований)');
  if (s === 1223 || (kind === 'key' && /реверс/i.test(n))) v.feat.push('Тріскачка з реверсом'); if (/R\/L|правого та лівого/i.test(n)) v.feat.push('Для правої та лівої різьби');
  if (kind === 'key' && /\bLock\b/.test(n)) v.feat.push('Функція Torque Lock'); if (s === 1206) v.feat.push('Шкала в дюйм-фунтах (in·lb)');
  if (/пістолетн|ручкою-пістолетом/i.test(n) || PG.test(dsFlat(it))) v.feat.push('Пістолетна ручка');
  if (RL.test(dsFlat(it)) && !v.feat.includes('Для правої та лівої різьби')) v.feat.push('Для правої та лівої різьби'); if (/т-подібн/i.test(n)) v.feat.push('Т-подібна ручка');
  if (s === 1465) v.feat = []; // spare parts: the features describe the wrench they fit, not the part
  out.push(v); }
module.exports = { out, disputed };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; };
  console.log('items', out.length, 'disputed', disputed.length); for (const k of ['vyd', 'torque', 'set', 'drv', 'nas', 'nsize', 'profile', 'tip', 'feat']) console.log(k, JSON.stringify(c(k)));
  console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 90)}`).join('\n'));
  if (process.argv[2]) for (const v of out.filter(v => v.sec == process.argv[2])) console.log(v.a, v.vyd[0], '|', v.torque.join(','), '|', v.set.join(','), '|', v.drv.join(','), '|', v.feat.join(','), '|', v.title.slice(0, 70)); }
