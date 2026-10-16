// Group «Kraftform Kompakt» (1057): values from section, series table row (Vario) and title.
// Reused only: vyd_instrumentu, profil, rozmir_nakonechnyka, osoblyvosti_vykrutky.
const I = require('./1057_items.json');
const norm = s => s.replace(/ W[Ee][Rr][Aa] \S+$/, '').replace(/[​]/g, '').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″');
const dec = v => (/,/.test(v) ? v : v + ',0');
const PROF = { SL: 'SL (шліц)', PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', TX: 'TX (TORX®)', HEX: 'HEX (шестигранник)', SQ: 'Квадрат (Robertson)', TRI: 'TRI-WING®', TS: 'TORQ-SET® Mplus', SP: 'Spanner (натяжні гвинти)' };
const tokens = n => { const m = n.match(/\(([^)]*)\)/g) || []; const t = new Set();
  for (const g of m) for (const w of g.slice(1, -1).split(/,\s*/)) { const x = w.trim().toUpperCase();
    if (x === 'SL') t.add('SL'); else if (x === 'PH') t.add('PH'); else if (x === 'PZ' || x === 'PZ/S') t.add('PZ'); else if (x === 'TX' || x === 'TORX') t.add('TX'); else if (x === 'HEX') t.add('HEX');
    else if (x === 'КВАДРАТ') t.add('SQ'); else if (x === 'TRI-WING') t.add('TRI'); else if (x === 'TORQ-SET') t.add('TS'); else if (x === 'SPUNNER' || x === 'SPANNER') t.add('SP'); }
  return [...t]; };
function vario(it, n) { const r = it.row || {}; const m = n.match(/Vario (\S+)-(\S+) (.+?)\s*$/); if (!m) return null; const kinds = [m[1], m[2]].map(k => ({ 'TX': 'TX', 'PZ': 'PZ', 'PH': 'PH', 'HEX': 'HEX', 'SL': 'SL', 'квадрат': 'SQ' }[k]));
  const sizes = m[3].split(/\s+-\s+/).map((s, i) => { s = s.trim(); const k = kinds[i]; if (k === 'TX') return (s.match(/TX ?(\d+)/) || [])[1]; if (k === 'PH' || k === 'PZ') return (s.match(/(?:PH|PZ) ?(\d)/) || [])[1];
    if (k === 'SQ') return (s.match(/# ?(\d)/) || [])[1]; if (k === 'HEX' || k === 'SL') { const x = (s.match(/^(\d+(?:,\d+)?)$/) || [])[1]; return x && dec(x); } return null; });
  return { prof: [...new Set(kinds.map(k => PROF[k]))], size: [...new Set(sizes.filter(Boolean))], ok: kinds.every(Boolean) && sizes.every(Boolean) }; }
const out = [], disputed = [];
for (const it of I) { const s = it.secs[0], n = norm(it.title); let vyd, kind = null;
  const isEnd = /робочий кінець Vario/i.test(n);
  if (isEnd) { vyd = 'Змінний робочий кінець Vario'; kind = 'end'; }
  else if (/^Ударно-поворотна викрутка/i.test(n)) vyd = 'Ударно-поворотна викрутка';
  else if (/набір|набором|Set\b|комплект|календар|Tool Finder|Wera 2go|Zyklop MS1|Bicycle Set|Kompakt \d+ ?(?:RA|КК|Imperial)?\b.*\(/i.test(n) || s === 1059) vyd = 'Набір інструментів';
  else if (/подовжувач|перехідник|адаптер(?!.*ручк)/i.test(n) && !/ручк/i.test(n)) vyd = 'Приладдя';
  else vyd = 'Ручка-тримач';
  const v = { a: it.a, title: it.title, secs: it.secs, sec: s, kind, vyd: [vyd], profile: [], size: [], feat: [] };
  if (kind === 'end') { const r = vario(it, n); if (r && r.ok) { v.profile = r.prof; v.size = r.size; } else disputed.push({ a: it.a, sec: s, what: 'Профіль / Розмір наконечника', why: 'не разобран из названия', title: it.title }); }
  else v.profile = tokens(n).map(k => PROF[k]);
  if (/\bRA\b|RA-R|RA S|тріскачк|тріщатк/i.test(n)) v.feat.push('З тріскачкою'); if (/магазин/i.test(n)) v.feat.push('Магазин біт у ручці'); if (/Rapidaptor/i.test(n)) v.feat.push('Патрон Rapidaptor');
  if (/\bESD\b/.test(n)) v.feat.push('ESD'); if (/Stubby|коротк/i.test(n)) v.feat.push('Коротка (Stubby)'); if (/нержав/i.test(n)) v.feat.push('Нержавіюча сталь');
  if (/Imperial|дюймов/i.test(n)) v.feat.push('Дюймовий (Imperial)'); if (/гнучк/i.test(n)) v.feat.push('Гнучкий стрижень'); if (/магніт/i.test(n)) v.feat.push('З магнітом'); if (/кульков/i.test(n)) v.feat.push('Кулькова головка');
  out.push(v); }
// non-products inside the Vario section get all its profile and size values (CLAUDE.md filters rule)
const ends = out.filter(v => v.kind === 'end');
for (const v of out.filter(v => v.sec === 1058 && !v.kind && v.vyd[0] !== 'Набір інструментів')) { v.profile = [...new Set(ends.flatMap(e => e.profile))]; v.size = [...new Set(ends.flatMap(e => e.size))]; }
module.exports = { out, disputed };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; };
  console.log('items', out.length, 'disputed', disputed.length); for (const k of ['vyd', 'profile', 'size', 'feat']) console.log(k, JSON.stringify(c(k)));
  console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 90)}`).join('\n'));
  if (process.argv[2]) for (const v of out.filter(v => v.sec == process.argv[2])) console.log(v.a, v.vyd[0], '|', v.profile.join(','), '|', v.size.join(','), '|', v.feat.join(','), '|', v.title.slice(0, 70)); }
