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
  FIVE: { icon: null, ua: 'Five Lobe', ru: 'Five Lobe', chip: 'Five Lobe' },   // owner 29.10.2026: a group without an icon
};
// «Профіль» value (UA) -> key; Торцева головка / XZN / шафові — no screw profile, a text group
const BY_PROFIL = { 'PH (Phillips)': 'PH', 'PZ (Pozidriv)': 'PZ', 'PlusMinus (PH/PZ + шліц)': 'PM', 'TX (TORX®)': 'TX', 'TX BO (TORX® з отвором)': 'TXBO',
  'IP (TORX PLUS®)': 'IP', 'IPR (TORX PLUS® IPR)': 'IPR', 'SL (шліц)': 'SL', 'HEX (шестигранник)': 'HEX', 'HEX BO (шестигранник з отвором)': 'HEXBO',
  'Квадрат (Robertson)': 'SQ', 'TRI-WING®': 'TRI', 'TORQ-SET® Mplus': 'TORQ', 'Spanner (натяжні гвинти)': 'SPAN', 'Microstix®': 'MSX', 'Pentalobe': 'PENTA',
  'Торцева головка (зовнішній шестигранник)': 'c:SOCKET', 'XZN (багатозубцевий)': 'c:SOCKET',
  'Внутрішній квадрат (шафовий)': 'c:CABINET', 'Тригранник (шафовий)': 'c:CABINET', 'Подвійна борідка (шафова)': 'c:CABINET' };
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
  CABINET: { ua: 'Вставки для розподільчих шаф', ru: 'Вставки для распределительных шкафов', one: { ua: 'Вставка для розподільчих шаф', ru: 'Вставка для распределительных шкафов' } },
  SET: { ua: 'Набори', ru: 'Наборы', one: { ua: 'Набір', ru: 'Набор' } },
  ACC: { ua: 'Приладдя', ru: 'Принадлежности' },
  // owner 10.11.2026: drills, taps, impact driver — own text groups at the end, like handles and keys
  DRILL: { ua: 'Свердла', ru: 'Свёрла', one: { ua: 'Свердло', ru: 'Сверло' } },
  TAP: { ua: 'Мітчики', ru: 'Метчики', one: { ua: 'Мітчик', ru: 'Метчик' } },
  IMPACT: { ua: 'Ударний гвинтоверт', ru: 'Ударный винтовёрт' },
  // 10.11.2026, by analogy with the owner's drills / taps (845 / 846 countersink bits in bit sets) — reported to the owner
  BIT41: { ua: 'Біти 4 в 1', ru: 'Биты 4 в 1', one: { ua: 'Біта 4 в 1', ru: 'Бита 4 в 1' } },   // owner 10.11.2026: 9506 / 9507 — a text group, no icon
  SINK: { ua: 'Зенкери', ru: 'Зенкеры', one: { ua: 'Зенкер', ru: 'Зенкер' } },
  // owner 11.11.2026: other brands in Wera 2go SHK 1 / E 1 / H 1 (STABILA, Lyra, PICARD, PUK, BESSEY, KIRSCHEN, Jung) — text groups at the end
  MEASURE: { ua: 'Вимірювальний і розмічальний інструмент', ru: 'Измерительный и разметочный инструмент' },
  HAMMER: { ua: 'Молотки', ru: 'Молотки', one: { ua: 'Молоток', ru: 'Молоток' } },
  CUT: { ua: 'Ріжучий інструмент', ru: 'Режущий инструмент' },
};
const BY_VYD = { 'Ручка-тримач': 'HANDLE', 'Ручка-вороток': 'HANDLE', 'Викрутка': 'SCREWDRIVER', 'Тріскачка': 'RATCHET',
  'Торцева головка': 'SOCKET', 'Торцева головка подовжена': 'SOCKET', 'Торцева головка з фіксуючою функцією': 'SOCKET', 'Торцева головка ударна Impaktor': 'SOCKET', 'Торцева головка ударна Impaktor подовжена': 'SOCKET',
  'Двосторонній ріжковий ключ': 'KEY', 'Ріжковий ключ': 'KEY', 'Комбінований ключ': 'KEY', 'Г-подібний ключ': 'KEY', 'Динамометричний ключ': 'TORQUE',
  'Динамометрична викрутка': 'TORQUE', 'Індикатор крутного моменту': 'TORQUE', 'Індикатор напруги': 'TESTER',
  'Приладдя': 'ACC', 'Перехідник': 'ACC', 'Бітотримач': 'ACC', 'Ложемент': 'ACC', 'Підставка / тримач': 'ACC', 'Оправка-хвостовик': 'ACC', 'Ремкомплект / запчастина': 'ACC', 'Знімач': 'ACC',
  'Спіральне свердло': 'DRILL', 'Свердло по дереву': 'DRILL', 'Східчасте свердло': 'DRILL', 'Комбінований мітчик': 'TAP', 'Однопрохідний мітчик': 'TAP', 'Ударно-поворотна викрутка': 'IMPACT', 'Конічний зенкер (3 канавки)': 'SINK', 'Конічний зенкер (1 канавка)': 'SINK' };
// not on our site: by the datasheet head
const BY_HEAD = [[/клещи|кліщі|zange/i, 'PLIERS'], [/трещотк|тріскачк/i, 'RATCHET'], [/торцов\S* головк/i, 'SOCKET'], [/ключ/i, 'KEY'], [/ложемент|держател|переходник|удлинител|сумк|чехол/i, 'ACC']];
function group(p, head = '') {
  if (!p) { const m = BY_HEAD.find(([re]) => re.test(head)); return m ? { key: 'c:' + m[1] } : { question: 'не на сайті, вид за паспортом не визначено: ' + head }; }
  const ch = p.characteristics || {}; const pr = [...new Set((ch.profil || []).map(x => BY_PROFIL[x.value.ua] || '?' + x.value.ua))];
  const vy = (ch.vyd_instrumentu || []).map(x => x.value.ua).join(' ');
  // owner 29.10.2026: a nested set is one position of the group «Набори» — also «Викрутка з набором біт» (Kompakt Turbo i 1 Tool Finder in Wera 2go E 1, 11.11.2026)
  if (pr.length > 1 && /^Набір|Ложемент|Інструментальний візок|^Викрутка з набором біт/.test(vy)) return { key: 'c:SET' };
  // a handle carries the profiles of its section (1014 Kraftform Micro 05051278001) — still a handle
  if (pr.length > 1 && (ch.vyd_instrumentu || []).some(x => BY_VYD[x.value.ua] === 'HANDLE')) return { key: 'c:HANDLE' };
  if (pr.length > 1) return { question: 'два профілі: ' + (ch.profil || []).map(x => x.value.ua).join(' + ') };
  if (pr.length === 1) return pr[0].startsWith('?') ? { question: 'профіль без групи: ' + pr[0].slice(1) } : { key: pr[0] };
  const v = [...new Set((ch.vyd_instrumentu || []).map(x => BY_VYD[x.value.ua] || '?' + x.value.ua))];
  if (v.length === 1 && !v[0].startsWith('?')) return { key: 'c:' + v[0] };
  return { question: 'без профілю, вид: ' + ((ch.vyd_instrumentu || []).map(x => x.value.ua).join(' + ') || 'немає') };
}
const def = key => key.startsWith('c:') ? CAT[key.slice(2)] : PROF[key];
module.exports = { group, def, PROF, CAT };
