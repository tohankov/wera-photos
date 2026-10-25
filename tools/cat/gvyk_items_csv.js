// Owner 25.10.2026: control table of every VISIBLE article of «Викрутки» -> docs/global_vykrutky_items.csv (UTF-8 BOM, «;»):
// article, name UA, «Профіль і розмір», «Довжина стрижня», «Особливості», «Вид», sections, photos before / now, wera.de page, what was fixed (from the write plans).
//   node cat/gvyk_items_csv.js <export before (24.10)> <fresh export> <SP dir>
const fs = require('fs'), path = require('path'); const [, , B, N, SP] = process.argv;
const before = Object.fromEntries(JSON.parse(fs.readFileSync(B, 'utf8')).map(p => [p.article, p])); const now = JSON.parse(fs.readFileSync(N, 'utf8')).filter(p => +p.display_in_showcase === 1);
const W = require('../../inventory/wera/pages.json'); const M = require(path.join(SP, 'night/menu_tree.json')); const name = id => (M.find(s => s.id === +id) || {}).path || id;
const fixed = {}; const add = (a, t) => (fixed[a] = fixed[a] || []).push(t); const J = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
for (const [f, t] of [['names/set_global_vyk.json', 'название'], ['names/set_global_vyk2.json', 'название (номер серии / SL / IPR)']]) for (const a of Object.keys(J(path.join(__dirname, '..', f)) || {})) add(a, t);
for (const x of (J(path.join(__dirname, 'gvyk_feat900_plan.json')) || { products: [] }).products) add(x.article, 'особенности серии 900');
for (const n of ['gvyk_len81', 'gvyk_len105', 'gvyk_len107']) for (const x of (J(path.join(__dirname, n + '_plan.json')) || { products: [] }).products) add(x.article, 'довжина стрижня');
for (const x of (J(path.join(__dirname, 'gvyk_move_plan.json')) || { products: [] }).products) add(x.article, 'разделы');
for (const [f] of [['g2/w/desc_plan.json'], ['g2/w/phrase_plan.json'], ['g2/w/shot1013_plan.json']]) for (const [a, x] of Object.entries((J(path.join(SP, f)) || { products: {} }).products)) for (const w of x.why) add(a, 'описание: ' + w.replace(/:.*/, '').replace(/^(ua|ru): /, ''));
for (const [a, x] of Object.entries(J(path.join(SP, 'g2/photo/replace_state.json')) || {})) if (x.done) add(a, 'главное фото без фона');
for (const [a, x] of Object.entries(J(path.join(SP, 'g2/wadd/add_state.json')) || {})) if (x.done) add(a, `+${x.added} фото WERA`);
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua).join(', ');
const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
const rows = [['Артикул', 'Название UA', 'Профіль і розмір', 'Довжина стрижня', 'Особливості викрутки', 'Вид інструменту', 'Разделы (основной; доп.)', 'Фото было (24.10)', 'Фото сейчас', 'wera.de', 'Что исправлено']];
for (const p of now) { const a = p.article; rows.push([a, p.mod_title.ua, v(p, 'rozmir_nakonechnyka'), v(p, 'dovzhyna_stryzhnia'), v(p, 'osoblyvosti_vykrutky'), v(p, 'vyd_instrumentu'),
  [name(p.parent.id), ...(p.alt_parent || []).map(x => 'доп.: ' + name(x.id))].join('; '), ((before[a] || {}).images || []).length, (p.images || []).length, W.art[a] || '— (404)', [...new Set(fixed[a] || [])].join('; ') || '—']); }
const out = path.join(__dirname, '../../docs/global_vykrutky_items.csv'); fs.writeFileSync(out, '\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n'));
console.log('rows', rows.length - 1, '| fixed', rows.slice(1).filter(r => r[10] !== '—').length);
