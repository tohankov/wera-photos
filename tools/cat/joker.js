// Group «Гайкові ключі Joker» (1185): values from section, series table row, title, set composition from WERA datasheets (cat/1185_sets.json).
// Reused: vyd_instrumentu. New: rozmir_pid_kliuch, systema_rozmiriv, osoblyvosti_haikovoho_kliucha.
const I = require('./1185_items.json'); const SETS = require('./1185_sets.json');
const norm = s => s.replace(/ WERA \S+$/, '').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″“]+/g, '$1″').replace(/(\d)\s*[хХ×x]\s*(?=\d)/g, '$1x');
const mm = v => String(v).replace('.', ',').replace(/,0$/, '') + ' мм', inch = v => String(v).replace(/["”″“]/g, '') + '″';
const range = (a, b) => `${a}–${b} мм`;
function sizesOf(it) { const n = norm(it.title), r = it.row || {}; let m;
  if (r['Розмір ключа 1 мм']) return [mm(r['Розмір ключа 1 мм']), mm(r['Розмір ключа 2 мм'])];
  if (r['Розмір ключа мм']) return [mm(r['Розмір ключа мм'])]; if (r['Розмір ключа дюйми']) return [inch(r['Розмір ключа дюйми'])];
  if ((m = n.match(/(\d+)-(\d+) \/ (\d+)-(\d+) мм/))) return [range(m[1], m[2]), range(m[3], m[4])];
  if ((m = n.match(/(\d+)-(\d+) мм/))) return [range(m[1], m[2])];
  if ((m = n.match(/(\d+)x(\d+) мм/))) return [mm(m[1]), mm(m[2])];
  if ((m = n.match(/(\d+\/\d+)″\s*$/)) || (m = n.match(/, (\d+\/\d+)″/))) return [inch(m[1])];
  if ((m = n.match(/(\d+(?:,\d+)?) мм\s*$/)) || (m = n.match(/, (\d+(?:,\d+)?) мм/))) return [mm(m[1])]; return []; }
// accessories in the composition (Velcro strips, pouches) give no sizes; cat/1185_sets.json = the full WERA PDF (all pages) since 22.10.2026
const ACC = /липучк|сумк|футляр|чехол/i;
function setSizes(a) { const g = SETS[a]; if (!g) return []; const s = [];
  for (const grp of g.filter(x => !/^9610/.test(x.code) && !ACC.test(x.head))) for (const it of grp.items) { const z = norm(it.size); let m;
    if ((m = z.match(/^(\d+);[\d; ]*?(\d+) мм x/))) { s.push(range(m[1], m[2])); const k = z.match(/ x (\d+);[\d; ]*?(\d+) мм x/); if (k) s.push(range(k[1], k[2])); continue; }
    if (/двусторон/i.test(grp.head) && (m = z.match(/^(\d+(?:,\d+)?) мм x (\d+(?:,\d+)?) мм/))) { s.push(mm(m[1]), mm(m[2])); continue; }
    if ((m = z.match(/^(\d+(?:,\d+)?) мм/))) s.push(mm(m[1])); else if ((m = z.match(/^(\d+\/\d+)″/))) s.push(inch(m[1])); }
  return [...new Set(s)]; }
const out = [], disputed = [];
for (const it of I) { const s = it.secs[0], n = norm(it.title); const isSet = s === 1193 || /^Набір|набір/i.test(n);
  let vyd; if (isSet) vyd = 'Набір ключів'; else if (s === 1186 || /двосторонн/i.test(n)) vyd = 'Двосторонній ріжковий ключ'; else if (s === 1194 || /ріжков|рожков/i.test(n)) vyd = 'Ріжковий ключ'; else vyd = 'Комбінований ключ';
  const v = { a: it.a, title: it.title, secs: it.secs, sec: s, kind: !isSet, vyd: [vyd], size: [], sys: [], feat: [] };
  v.size = isSet ? setSizes(it.a) : sizesOf(it);
  if (!v.size.length) (isSet ? disputed.push({ a: it.a, sec: s, what: 'Розмір під ключ', why: 'состав набора не указан в datasheet WERA', title: it.title }) : disputed.push({ a: it.a, sec: s, what: 'Розмір під ключ', why: 'нет в таблице и названии', title: it.title }));
  if (v.size.some(z => /мм$/.test(z))) v.sys.push('Метрична'); if (v.size.some(z => /″$/.test(z))) v.sys.push('Дюймова');
  if (!v.sys.length) { if (/дюйм|Imperial/i.test(n)) v.sys.push('Дюймова'); else if (/\d мм/.test(n)) v.sys.push('Метрична'); }
  if (/Switch|реверсн|реверсив/i.test(n)) v.feat.push('З реверсною тріскачкою (Switch)'); else if (/тріскачк/i.test(n)) v.feat.push('З тріскачкою');
  if (/подовжен/i.test(n)) v.feat.push('Подовжений'); if (/самоналашт/i.test(n)) v.feat.push('Самоналаштування'); if (/VDE|ізольован/i.test(n)) v.feat.push('VDE (ізольований)');
  if (/Магнітний тримач/i.test(n)) v.feat.push('З магнітним тримачем'); if (/Black Edition/i.test(n)) v.feat.push('Black Edition');
  out.push(v); }
module.exports = { out, disputed };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; }; const { cmp } = require('../lib/valsort.js');
  console.log('items', out.length, 'disputed', disputed.length); for (const k of ['vyd', 'sys', 'feat']) console.log(k, JSON.stringify(c(k)));
  console.log('size', Object.keys(c('size')).sort(cmp).join(' · ')); console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 90)}`).join('\n'));
  if (process.argv[2]) for (const v of out.filter(v => v.sec == process.argv[2])) console.log(v.a, v.vyd[0], '|', v.size.join(','), '|', v.sys.join(','), '|', v.feat.join(','), '|', v.title.slice(0, 60)); }
