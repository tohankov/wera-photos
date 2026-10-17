// Product-type words at the start of a title, brought to the form the catalog already uses for the same type (the RU title confirms the type).
// [regex on UA, replacement, RU must match (type check)] — only the leading type phrase changes; sizes and series stay.
const UA = [
  [/^Біти(?= (?:TORX|TRI-WING|PH|PZ|TX|Pozidriv|Phillips|з |"|«))/, 'Біта', /^Бита /],
  [/^Торсійний біт /, 'Біта торсійна ', /^Бита торсионная/],
  [/^Шестигранна торсійна біта /, 'Біта шестигранна торсійна ', /^Бита шестигранная торсионная/],
  [/^Шестигранна біта /, 'Біта шестигранна ', /^Бита шестигранная/],
  [/^Шліцьова фреза /, 'Біта шліцева ', /^Бита шлицевая/],
  [/^Біта торсіонна/, 'Біта торсійна', /^Бита торсионная/],
  [/^Хвостовик біти /, 'Біта хвостовик ', /^Бита хвостовик/],
  [/^Викрутка головка /, 'Викруткова головка ', /^Отв[её]рточная головка/],
  [/^Спіральний свердло/, 'Спіральне свердло', /^Спиральное сверло/],
  [/^Тремтіння-насадка/, 'Тріскачка-насадка', /^Трещотка-насадка/],
  [/^Відвернення Microstix®/, 'Викрутка Microstix®', /^Отв?ерка Microstix®/],
  [/^Компактна (?:тріска|тріщетка)/, 'Компактна тріскачка', /^Компактная трещ[её]тка/],
  [/^Трещітка /, 'Тріскачка ', /^Трещ[её]тка /],
  [/^Трещотка Zyklop/, 'Тріскачка Zyklop', /^[TТ]рещотка Zyklop/],
  [/^Cyclop Mini/, 'Zyklop Mini', /^Zyklop Mini/],
  [/^Біт-Чек /, 'Bit-Check ', /^Bit-Check /],
];
// spelling inside UA titles: «шлицева/шліцьова» -> «шліцева» (the catalog's dominant form), Latin look-alike letters inside Cyrillic words
const UA_WORDS = [[/(?<![А-Яа-яІіЇїЄє])([Шш])(?:лицев|ліцьов)(?=[а-яіїє])/gu, '$1ліцев']];
const RU_WORDS = [[/(?<![А-Яа-яЁё])([Тт])рещетк/gu, '$1рещотк']];
const RU = [
  [/^Отверка Microstix®/, 'Отвёртка Microstix®'], [/^Трещетка /, 'Трещотка '], [/^Компактная трещётка/, 'Компактная трещотка'], [/^Складнаяя /, 'Складная '],
];
// a Latin letter that looks Cyrillic inside an otherwise Cyrillic word («Tорцевая», «Cумка»)
const LAT = { A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', K: 'К', M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х', a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у', i: 'і' };
const lat = (t, lang) => t.replace(/[A-Za-zА-Яа-яЁёІіЇїЄєҐґ']+/g, w => { const cyr = (w.match(/[А-Яа-яЁёІіЇїЄєҐґ]/g) || []).length, l = w.match(/[A-Za-z]/g) || [];
  if (cyr < 2 || l.length !== 1 || !LAT[l[0]] || (l[0] === 'i' && lang === 'ru')) return w; return w.replace(/[A-Za-z]/, c => LAT[c]); });
function fix(ua, ru) { const hit = []; let u = ua, r = ru;
  for (const [re, to, ruRe] of UA) if (re.test(u) && ruRe.test(r)) { u = u.replace(re, to); hit.push('type'); break; }
  for (const [re, to] of UA_WORDS) { const n = u.replace(re, to); if (n !== u) { u = n; hit.push('spell'); } }
  for (const [re, to] of RU) if (re.test(r)) { r = r.replace(re, to); hit.push('type'); break; }
  for (const [re, to] of RU_WORDS) { const n = r.replace(re, to); if (n !== r) { r = n; hit.push('spell'); } }
  const u2 = lat(u, 'ua'), r2 = lat(r, 'ru'); if (u2 !== u || r2 !== r) hit.push('lat'); return { ua: u2, ru: r2, hit: [...new Set(hit)] }; }
module.exports = { fix, lat };
