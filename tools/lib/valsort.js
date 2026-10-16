// Ascending order of filter values (not alphabetical): 000 < 00 < 0 < 1 …; numbers by value (int < decimal < «мм» at the same value);
// threads M…; inch values by size; ranges «a–b Нм» by the lower bound; everything else keeps the given order (letters last).
// Size «0» is stored as "0" + NBSP: Horoshop treats a plain "0" as empty and hides the row on the product page (filter works either way).
const ZERO = '0 '; const fixZero = v => v === '0' ? ZERO : v;
function sortKey(v) {
  v = String(v); if (v === ZERO) v = '0';
  if (/^0{2,3}$/.test(v)) return [0, -v.length];
  let m = v.match(/^(\d+(?:,\d+)?)( мм| Нм| г| см)?$/); if (m) return [0, parseFloat(m[1].replace(',', '.')), m[2] ? 2 : /,/.test(m[1]) ? 1 : 0];
  m = v.match(/^M(\d+)$/); if (m) return [1, +m[1]];
  m = v.match(/^(?:(\d+) )?(\d+)\/(\d+)″$/); if (m) return [2, (+m[1] || 0) + m[2] / m[3]];
  m = v.match(/^(\d+(?:,\d+)?)″$/); if (m) return [2, parseFloat(m[1].replace(',', '.'))];
  m = v.match(/^(\d+(?:,\d+)?)[–-](\d+(?:,\d+)?)/); if (m) return [3, parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))];
  return [9, v];
}
function cmp(a, b) { const x = sortKey(a), y = sortKey(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if (x[i] === y[i]) continue; if (x[i] === undefined) return -1; if (y[i] === undefined) return 1; return x[i] < y[i] ? -1 : 1; } return 0; }
module.exports = { sortKey, cmp, ZERO, fixZero };
