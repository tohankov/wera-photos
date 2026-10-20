// «Вид інструменту» (vyd_instrumentu, dictionary 388) of EVERY product against its WERA datasheet (owner 21.10.2026, read-only):
//  - a «Набір …» value needs a set (composition table «Содержимое:» with 2+ different tools, cat/ds_comp_all.json; or a set title / datasheet name)
//    whose composition has what the value says (Набір з тріскачкою — a ratchet; Набір викруток — a screwdriver or a handle + bits; Набір біт — bits; …);
//  - a single kind (Викрутка, Тріскачка, Ручка-тримач …) must not sit on a set and must match the product name in the datasheet.
// Rules — cat/vyd_comp.js (shared with the generators); which generator gives the value — cat/vyd_sources.json (all g_*.js).
//   node cat/vyd_audit.js <live.json>  -> cat/vyd_audit.json (flagged values)
const fs = require('fs'), path = require('path');
const C = require('./vyd_comp.js'); const { has, NEED } = C;
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const SRC = require('./vyd_sources.json');
const T = require('../sections/tree_now.json'); const name = Object.fromEntries(T.map(p => [p.id, p.title.ua]));
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const SPECIAL = new Set(['Ложемент', 'Інструментальний візок', 'Ремкомплект / запчастина']);
const isSetVal = x => /^Набір/.test(x);
const setTitle = s => /набір|набор|предмет|комплект|\bset\b/i.test(s);
// a single kind must match the product name in the WERA datasheet (first line) — checked only for kinds with a clear word
const KIND = { 'Викрутка': /отв[её]р?т?к|screwdriver|торцовый ключ для электронщ/i, 'Тріскачка': s => has.ratchet(s), 'Торцева головка': /голов|торцов/i, 'Торцева головка подовжена': /голов|торцов/i,
  'Торцева головка з фіксуючою функцією': /голов|торцов/i, 'Торцева головка ударна Impaktor': /голов|торцов|impaktor/i, 'Торцева головка ударна Impaktor подовжена': /голов|торцов|impaktor/i,
  'Викруткова головка': /головк/i, 'Г-подібний ключ': /г-образн/i, 'Комбінований ключ': /ключ/i, 'Ріжковий ключ': /ключ/i, 'Двосторонній ріжковий ключ': /ключ/i,
  'Динамометричний ключ': /ключ|click-torque|torque/i, 'Динамометрична викрутка': /отв[её]р?т?к|torque|ручк|динамометр|\bnm\b|нм/i, 'Ручка-тримач': /ручк|рукоятк|держател|динамометр|переходник/i, 'Бітотримач': /держател|адаптер|rapidaptor/i,
  'Змінна насадка': /насадк|бит|bit/i, 'Змінна вставка': /kompakt|сменн|вставк|стерж|take it easy/i, 'Спіральне свердло': /сверл/i, 'Свердло по дереву': /сверл/i, 'Східчасте свердло': /сверл/i,
  'Перехідник': /переходник|адаптер|оправк|соедин|удлинит/i, 'Оправка-хвостовик': /оправк|хвостовик/i, 'Індикатор напруги': /тестер|индикатор/i, 'Індикатор крутного моменту': /индикатор|torque|тестер/i,
  'Ударно-поворотна викрутка': /ударн/i, 'Ручка-вороток': /вороток|ручк|актуатор/i };
const rows = [];
for (const p of L) { const vy = v(p, 'vyd_instrumentu'); if (!vy.length) continue; const a = p.article, t = p.title.ua;
  const isSet = C.isSet(a), compText = C.compText(a), text = C.text(a), first = C.first(a);
  for (const val of vy) { if (SPECIAL.has(val)) continue; const r = { a, title: t, sec: name[p.parent.id], all: vy.join(' + '), val, src: (SRC[a] || []).filter(s => s.v.includes(val)).map(s => s.g).join(', ') || 'інший скрипт (біти / rest)', set: isSet ? 'набір (склад у даташиті)' : setTitle(t) || setTitle(first) ? 'набір (назва)' : 'одиночний' };
    if (isSetVal(val)) { const need = NEED[val]; if (!need) { r.res = 'спірне'; r.why = 'невідоме значення'; rows.push(r); continue; }
      if (isSet) { if (need[1](compText)) continue; if (need[1](text)) { r.res = 'спірне'; r.why = `у складі немає, але текст даташиту згадує: ${need[0]}`; r.quote = compText.slice(0, 400); rows.push(r); continue; }
        r.res = 'помилка'; r.why = `у складі WERA немає: ${need[0]}`; r.quote = compText.slice(0, 400); }
      else if (setTitle(t) || setTitle(first)) { if (need[1](t + ' ' + text)) continue; r.res = 'спірне'; r.why = `складу в даташиті немає, у тексті не знайдено: ${need[0]}`; r.quote = first; }
      else { r.res = 'помилка'; r.why = 'одиночний товар (у даташиті немає складу, назва не набір) з видом «Набір…»'; r.quote = first; } }
    else { if (!isSet) { const k = KIND[val]; const ok = !k || !first || (typeof k === 'function' ? k(first) : k.test(first));
        if (ok) continue; r.res = 'спірне'; r.why = `назва в даташиті WERA не схожа на «${val}»`; r.quote = first; rows.push(r); continue; }
      const other = vy.filter(x => x !== val);
      r.res = other.some(isSetVal) ? 'помилка' : 'спірне'; r.why = other.some(isSetVal) ? `набір: одиночний вид поруч із «${other.filter(isSetVal).join(', ')}»` : 'у даташиті склад із кількох позицій, а вид одиночний'; r.quote = compText.slice(0, 400); }
    rows.push(r); } }
fs.writeFileSync(path.join(__dirname, 'vyd_audit.json'), JSON.stringify({ checked: L.filter(p => v(p, 'vyd_instrumentu').length).length, values: L.reduce((n, p) => n + v(p, 'vyd_instrumentu').length, 0), rows }, null, 1));
console.log('products with «Вид інструменту»', L.filter(p => v(p, 'vyd_instrumentu').length).length, '| flagged values', rows.length, JSON.stringify(rows.reduce((c, r) => (c[r.res] = (c[r.res] || 0) + 1, c), {})));
for (const r of rows) console.log(r.res.padEnd(8), r.a, '|', r.all, '| −', r.val, '|', r.src, '|', r.why, '|', r.title.slice(0, 60), '\n          ', (r.quote || '').slice(0, 200));
