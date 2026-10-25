// Profile group of a set position for the grouped «Склад набору» block (owner 24.10.2026): by OUR data — the component's «Профіль» (profil),
// TX BO / PlusMinus / HEX of L-keys as written there; a position without a profile — a text group by «Вид інструменту» (vyd_instrumentu).
// Not on our site (no product) — by the datasheet head; two different profiles («PH 1 x PH 2», combination ends) -> question, no guess.
//   group(product|null, head) -> { key } | { question }
//   PROF[key] / CAT[key] -> { icon|null, ua, ru, chip?, one?: {ua, ru} }  (icon — file name in /content/uploads/images/icons/, null — text only)
const PROF = {
  PH: { icon: 'icon-ph', ua: 'Phillips PH', ru: 'Phillips PH', chip: 'PH' },
  PZ: { icon: 'icon-pz', ua: 'Pozidriv PZ', ru: 'Pozidriv PZ', chip: 'PZ' },
  PM: { icon: 'icon-ph-slot', ua: 'PlusMinus PH/S · PZ/S', ru: 'PlusMinus PH/S · PZ/S', chip: 'PlusMinus' },
  TX: { icon: 'icon-torx', ua: 'TORX® TX', ru: 'TORX® TX', chip: 'TX' },
  TXBO: { icon: 'icon-torx-bo', ua: 'TORX® з отвором TX BO', ru: 'TORX® с отверстием TX BO', chip: 'TX BO' },
  IP: { icon: 'icon-torx-plus', ua: 'TORX PLUS® IP', ru: 'TORX PLUS® IP', chip: 'IP' },
  IPR: { icon: null, ua: 'TORX PLUS® IPR', ru: 'TORX PLUS® IPR', chip: 'IPR' },
  SL: { icon: 'icon-sl', ua: 'Шліц SL', ru: 'Шлиц SL', chip: 'SL' },
  HEX: { icon: 'icon-hex', ua: 'Шестигранник HEX', ru: 'Шестигранник HEX', chip: 'HEX' },
  HEXBO: { icon: 'icon-hex-bo', ua: 'Шестигранник з отвором HEX BO', ru: 'Шестигранник с отверстием HEX BO', chip: 'HEX BO' },
  SQ: { icon: 'icon-square', ua: 'Квадрат', ru: 'Квадрат', chip: 'Квадрат' },
  TRI: { icon: 'icon-tri-wing', ua: 'TRI-WING®', ru: 'TRI-WING®', chip: 'TRI-WING®' },
  TORQ: { icon: 'icon-torq-set', ua: 'TORQ-SET® Mplus', ru: 'TORQ-SET® Mplus', chip: 'TORQ-SET®' },
  SPAN: { icon: 'icon-spanner', ua: 'Spanner', ru: 'Spanner', chip: 'Spanner' },
  MSX: { icon: null, ua: 'Microstix®', ru: 'Microstix®', chip: 'Microstix®' },
  PENTA: { icon: 'icon-pentalobe', ua: 'Pentalobe', ru: 'Pentalobe', chip: 'Pentalobe' },
};
// «Профіль» value (UA) -> key; Торцева головка / XZN / шафові — no screw profile, a text group
const BY_PROFIL = { 'PH (Phillips)': 'PH', 'PZ (Pozidriv)': 'PZ', 'PlusMinus (PH/PZ + шліц)': 'PM', 'TX (TORX®)': 'TX', 'TX BO (TORX® з отвором)': 'TXBO',
  'IP (TORX PLUS®)': 'IP', 'IPR (TORX PLUS® IPR)': 'IPR', 'SL (шліц)': 'SL', 'HEX (шестигранник)': 'HEX', 'HEX BO (шестигранник з отвором)': 'HEXBO',
  'Квадрат (Robertson)': 'SQ', 'TRI-WING®': 'TRI', 'TORQ-SET® Mplus': 'TORQ', 'Spanner (натяжні гвинти)': 'SPAN', 'Microstix®': 'MSX', 'Pentalobe': 'PENTA',
  'Торцева головка (зовнішній шестигранник)': 'c:SOCKET', 'XZN (багатозубцевий)': 'c:SOCKET' };
// groups without a profile: the heading names what is in the group (one position — singular)
const CAT = {
  HANDLE: { ua: 'Ручки-тримачі', ru: 'Ручки-держатели', one: { ua: 'Ручка-тримач', ru: 'Ручка-держатель' } },
  SCREWDRIVER: { ua: 'Викрутки', ru: 'Отвёртки', one: { ua: 'Викрутка', ru: 'Отвёртка' } },
  RATCHET: { ua: 'Тріскачки', ru: 'Трещотки', one: { ua: 'Тріскачка', ru: 'Трещотка' } },
  SOCKET: { ua: 'Торцеві головки', ru: 'Торцевые головки', one: { ua: 'Торцева головка', ru: 'Торцевая головка' } },
  KEY: { ua: 'Ключі', ru: 'Ключи', one: { ua: 'Ключ', ru: 'Ключ' } },
  PLIERS: { ua: 'Кліщі', ru: 'Клещи', one: { ua: 'Кліщі', ru: 'Клещи' } },
  TORQUE: { ua: 'Динамометричний інструмент', ru: 'Динамометрический инструмент' },
  TESTER: { ua: 'Індикатор напруги', ru: 'Индикатор напряжения' },
  ACC: { ua: 'Приладдя', ru: 'Принадлежности' },
};
const BY_VYD = { 'Ручка-тримач': 'HANDLE', 'Ручка-вороток': 'HANDLE', 'Викрутка': 'SCREWDRIVER', 'Тріскачка': 'RATCHET',
  'Торцева головка': 'SOCKET', 'Торцева головка подовжена': 'SOCKET', 'Торцева головка з фіксуючою функцією': 'SOCKET', 'Торцева головка ударна Impaktor': 'SOCKET', 'Торцева головка ударна Impaktor подовжена': 'SOCKET',
  'Двосторонній ріжковий ключ': 'KEY', 'Ріжковий ключ': 'KEY', 'Комбінований ключ': 'KEY', 'Г-подібний ключ': 'KEY', 'Динамометричний ключ': 'TORQUE',
  'Динамометрична викрутка': 'TORQUE', 'Індикатор крутного моменту': 'TORQUE', 'Індикатор напруги': 'TESTER',
  'Приладдя': 'ACC', 'Перехідник': 'ACC', 'Бітотримач': 'ACC', 'Ложемент': 'ACC', 'Підставка / тримач': 'ACC', 'Оправка-хвостовик': 'ACC', 'Ремкомплект / запчастина': 'ACC', 'Знімач': 'ACC' };
// not on our site: by the datasheet head
const BY_HEAD = [[/клещи|кліщі|zange/i, 'PLIERS'], [/трещотк|тріскачк/i, 'RATCHET'], [/торцов\S* головк/i, 'SOCKET'], [/ключ/i, 'KEY'], [/ложемент|держател|переходник|удлинител|сумк|чехол/i, 'ACC']];
function group(p, head = '') {
  if (!p) { const m = BY_HEAD.find(([re]) => re.test(head)); return m ? { key: 'c:' + m[1] } : { question: 'не на сайті, вид за паспортом не визначено: ' + head }; }
  const ch = p.characteristics || {}; const pr = [...new Set((ch.profil || []).map(x => BY_PROFIL[x.value.ua] || '?' + x.value.ua))];
  if (pr.length > 1) return { question: 'два профілі: ' + (ch.profil || []).map(x => x.value.ua).join(' + ') };
  if (pr.length === 1) return pr[0].startsWith('?') ? { question: 'профіль без групи: ' + pr[0].slice(1) } : { key: pr[0] };
  const v = [...new Set((ch.vyd_instrumentu || []).map(x => BY_VYD[x.value.ua] || '?' + x.value.ua))];
  if (v.length === 1 && !v[0].startsWith('?')) return { key: 'c:' + v[0] };
  return { question: 'без профілю, вид: ' + ((ch.vyd_instrumentu || []).map(x => x.value.ua).join(' + ') || 'немає') };
}
const def = key => key.startsWith('c:') ? CAT[key.slice(2)] : PROF[key];
module.exports = { group, def, PROF, CAT };
