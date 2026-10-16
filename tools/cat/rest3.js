// Groups «Бітотримачі» (1081), «Перехідники та адаптери» (1089), «Свердла та мітчики» (1090): values from section, series table row,
// title and WERA datasheet title (batch/ds) / set composition (lib/ds_set.mjs).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const dsTitle = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); if (!fs.existsSync(f)) return ''; const L = fs.readFileSync(f, 'utf8').split('\n').map(s => s.replace(/^p\d /, '')); const k = L.findIndex(s => /^EAN:/.test(s)); return L.slice(0, k > 0 ? k : 2).join(' '); };
const dsSet = a => { try { return JSON.parse(execFileSync('node', [path.join(__dirname, '../lib/ds_set.mjs'), path.join(__dirname, '../batch/ds', a + '.pdf')], { encoding: 'utf8' })); } catch (e) { return null; } };
const norm = s => s.replace(/ WERA \S+$/, '').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″“]+/g, '$1″');
const dec = v => { v = String(v).replace('.', ','); return /,/.test(v) ? v.replace(/(,\d)0$/, '$1') : v + ',0'; };

// ---- 1081 Бітотримачі
function holders() { const I = require('./1081_items.json'), out = [], disputed = [];
  for (const it of I) { const n = norm(it.title), t = norm(dsTitle(it.a)); let vyd = 'Бітотримач', kind = 'holder';
    if (/прокладок|обмежувач/i.test(n)) { vyd = 'Приладдя'; kind = null; } else if (/^Ручка-бітотримач/i.test(n)) { vyd = 'Ручка-тримач'; kind = null; }
    const v = { a: it.a, title: it.title, secs: it.secs, kind, vals: { vyd_instrumentu: [vyd], dovzhyna_bitotrymacha: [], osoblyvosti_bitotrymacha: [] } };
    const L = (it.row || {})['Довжина робочого кінця мм'] || ((t.match(/x (\d+) мм\s*$/) || t.match(/, (\d+) мм\s*$/) || [])[1]); if (L && kind !== null || (L && vyd === 'Ручка-тримач')) v.vals.dovzhyna_bitotrymacha = [String(L).replace(/,0$/, '') + ' мм'];
    if (kind && !v.vals.dovzhyna_bitotrymacha.length) disputed.push({ a: it.a, sec: it.secs[0], what: 'Довжина бітотримача', why: 'нет в таблице, названии и datasheet', title: it.title });
    const f = v.vals.osoblyvosti_bitotrymacha, s = n + ' ' + t;
    if (/магнітним кільцем|кільцевим магнітом|магнитным кольцом|кольцевым магнитом/i.test(s)) f.push('Магнітне кільце'); else if (/без магніту/i.test(n)) f.push('Без магніту'); else if (/магніт/i.test(n)) f.push('З магнітом');
    if (/пружинн/i.test(n)) f.push('Пружинне стопорне кільце'); if (/Rapidaptor/i.test(s)) f.push('Патрон Rapidaptor'); if (/BiTorsion/i.test(s)) f.push('BiTorsion');
    if (/ударний|IMP\b/i.test(n)) f.push('Ударний (Impaktor)'); if (/нержав/i.test(n)) f.push('Нержавіюча сталь'); if (/Halfmoon|HIOS/i.test(n)) f.push('Для біт Halfmoon / HIOS');
    if (/вільного ходу/i.test(n)) f.push('Муфта вільного ходу'); if (/глибиною загвинчування/i.test(n)) f.push('Регульована глибина загвинчування');
    out.push(v); }
  // non-products of the section get all its values (CLAUDE.md filters rule)
  const H = out.filter(v => v.kind); for (const v of out.filter(v => v.vals.vyd_instrumentu[0] === 'Приладдя')) for (const k of ['dovzhyna_bitotrymacha', 'osoblyvosti_bitotrymacha']) v.vals[k] = [...new Set(H.flatMap(h => h.vals[k]))];
  return { out, disputed }; }

// ---- 1089 Перехідники та адаптери. Connection sides from the WERA code in the datasheet title:
// 781 X/Y — square X → square Y; 780 / 784 X/n — square X → hex bit holder (n=1: 1/4″, n=2: 5/16″); 870/1, 870/4 — hex shank → square;
// 870/2 — hex 5/16″ shank; 870/7 — hex 7/16″ shank; 870/14 — SDS plus; 797 A/4/1 B — square 1/4″ → bit; 8784 A1/B1 Zyklop — square → bit 1/4″.
const SQ = { A: 'квадрат 1/4″', B: 'квадрат 3/8″', C: 'квадрат 1/2″' }, Q = { '1/4': 'квадрат 1/4″', '3/8': 'квадрат 3/8″', '1/2': 'квадрат 1/2″' };
function sides(a, n, t) { let m;
  if ((m = t.match(/781 ([ABC])\/([ABC])/))) return [SQ[m[1]], SQ[m[2]]];
  if ((m = t.match(/78[04] ([ABC])\/([12])/))) return [SQ[m[1]], m[2] === '1' ? 'шестигранник 1/4″' : 'шестигранник 5/16″'];
  if ((m = t.match(/^78[04] ([ABC]) 1\/4″.*?, 1\/4″ x \d+ мм/))) return [SQ[m[1]], 'шестигранник 1/4″'];
  if (/^870\/14/.test(t)) return ['SDS plus', 'квадрат 1/4″'];
  if (/^870\/7/.test(t) && (m = n.match(/(1\/2|3\/8|1\/4)″, привід 7\/16″/))) return ['шестигранник 7/16″', Q[m[1]]];
  if ((m = t.match(/^870\/2 Оправка-хвостовик, (1\/2|3\/8) x 5\/16″/))) return ['шестигранник 5/16″', Q[m[1]]];
  if ((m = t.match(/^870\/4 .*?(1\/4|3\/8)″ x (1\/2|3\/8|1\/4)″ x/))) return ['шестигранник 1/4″', Q[m[2]]];
  if ((m = t.match(/^870\/[14] .*?(1\/4|3\/8|1\/2)″ x \d+ мм/))) return ['шестигранник 1/4″', Q[m[1]]];
  if (/^797 A\/4\/1 B/.test(t)) return ['квадрат 1/4″', 'шестигранник 1/4″'];
  if ((m = t.match(/^8784 ([AB])1/))) return [SQ[m[1]], 'шестигранник 1/4″'];
  return null; }
function adapters() { const I = require('./1089_items.json'), out = [], disputed = [];
  for (const it of I) { const n = norm(it.title), t = norm(dsTitle(it.a)); const isSet = /^Набір/i.test(n);
    const vyd = isSet ? 'Набір перехідників' : /хвостовик/i.test(n) ? 'Оправка-хвостовик' : /BiTorsion/.test(n) ? 'Бітотримач' : 'Перехідник';
    const v = { a: it.a, title: it.title, secs: it.secs, kind: isSet ? null : 'adapter', vals: { vyd_instrumentu: [vyd], pryiednannia_do_instrumenta: [], pryiednannia_nasadky: [] } };
    if (isSet) { const g = dsSet(it.a) || []; for (const m of g.flatMap(x => x.items)) { const s = out.find(o => o.a === m.art) || (() => { const x = I.find(i => i.a === m.art); return x && { vals: (() => { const r = sides(x.a, norm(x.title), norm(dsTitle(x.a))); return r ? { pryiednannia_do_instrumenta: [r[0]], pryiednannia_nasadky: [r[1]] } : {}; })() }; })();
        if (s) for (const k of ['pryiednannia_do_instrumenta', 'pryiednannia_nasadky']) v.vals[k] = [...new Set([...v.vals[k], ...(s.vals[k] || [])])]; }
      if (!v.vals.pryiednannia_do_instrumenta.length) disputed.push({ a: it.a, sec: it.secs[0], what: 'Приєднання', why: 'состав набора не найден в datasheet', title: it.title }); }
    else { const r = sides(it.a, n, t); if (r) { v.vals.pryiednannia_do_instrumenta = [r[0]]; v.vals.pryiednannia_nasadky = [r[1]]; } else disputed.push({ a: it.a, sec: it.secs[0], what: 'Приєднання', why: 'код WERA не разобран: ' + t.slice(0, 60), title: it.title }); }
    out.push(v); }
  return { out, disputed }; }

// ---- 1090 Свердла та мітчики
const DVYD = { 1096: 'Спіральне свердло', 1097: 'Свердло по дереву', 1094: 'Східчасте свердло', 1091: 'Комбінований мітчик', 1093: 'Однопрохідний мітчик', 1092: 'Конічний зенкер (1 канавка)', 1095: 'Конічний зенкер (3 канавки)' };
function drills() { const I = require('./1090_items.json'), out = [], disputed = [];
  for (const it of I) { const s = it.secs[0], n = norm(it.title), r = it.row || {}; const isSet = /^Набір/i.test(n);
    const v = { a: it.a, title: it.title, secs: it.secs, kind: isSet ? 'set' : [1096, 1097, 1094].includes(s) ? 'drill' : 'tap', vals: { vyd_instrumentu: [isSet ? 'Набір мітчиків' : DVYD[s]], diametr_sverdla: [], rizba: [] } };
    let m; if (v.kind === 'drill') { if (r['Номінальний діаметр мм']) v.vals.diametr_sverdla = [dec(r['Номінальний діаметр мм']) + ' мм']; else if ((m = n.match(/(\d+)-(\d+) мм/))) v.vals.diametr_sverdla = [`${m[1]}–${m[2]} мм`]; }
    if (v.kind === 'tap' && r['Розмір']) v.vals.rizba = [String(r['Розмір']).replace(/\s+/g, '')];
    if (isSet) v.vals.rizba = [...new Set((dsSet(it.a) || []).flatMap(g => g.items).map(x => (x.size.match(/x M ?(\d+)$/) || [])[1]).filter(Boolean).map(x => 'M' + x))];
    const need = v.kind === 'drill' ? 'diametr_sverdla' : 'rizba'; if (!v.vals[need].length) disputed.push({ a: it.a, sec: s, what: need === 'rizba' ? 'Різьба' : 'Діаметр свердла', why: 'нет в таблице, названии и datasheet', title: it.title });
    out.push(v); }
  return { out, disputed }; }
module.exports = { holders, adapters, drills };
if (require.main === module) { const r = module.exports[process.argv[2]](); console.log('items', r.out.length, 'disputed', r.disputed.length);
  for (const v of r.out) console.log(v.a, v.secs[0], Object.values(v.vals).map(x => x.join(',')).join(' | '), '|', v.title.slice(0, 60)); console.log(r.disputed.map(d => `${d.a} ${d.what}: ${d.why}`).join('\n')); }
