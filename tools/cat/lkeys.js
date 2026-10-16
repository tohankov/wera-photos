// Group «Г-подібні ключі» (1152): values from series table row and title. Reused: vyd_instrumentu, profil. New: rozmir_kliucha, dovzhyna_kliucha, pokryttia, osoblyvosti_kliucha.
const I = require('./1152_items.json');
const num = s => String(s).replace('.', ',').trim(); const dec = v => (/,/.test(v) ? v : v + ',0');
const norm = s => s.replace(/(\d), (\d)/g, '$1,$2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(\d) ?["”″]/g, '$1″').replace(/(\d|″)\s*[хХ×]\s*(?=\d)/g, '$1x');
const PROF = { TX: 'TX (TORX®)', TXBO: 'TX BO (TORX® з отвором)', HEX: 'HEX (шестигранник)' };
function profiles(n) { const p = []; if (/TORX|\bTX\b/.test(n)) p.push(/\bBO\b/.test(n) ? 'TXBO' : 'TX'); if (/Hex-Plus|шестигран|HEX|метрич|дюймов|\d+,\d мм|\d\/\d+″/i.test(n) && !/^Г-подібний ключ TORX|TX \d|TX\d/.test(n)) p.push('HEX'); return [...new Set(p)]; }
function size(it, p) { const r = it.row || {}; const n = norm(it.title); let m;
  if (p === 'TX' || p === 'TXBO') { const pr = r['Профіль'] && String(r['Профіль']); m = (pr && pr.match(/TX ?(\d+)/)) || n.match(/TX ?(\d+)/); return m ? m[1] : null; }
  const a = r['Розмір ключа мм'], b = r['Розмір ключа дюйми']; if (a && a !== '-') return dec(num(a)); if (b && b !== '-') return String(b).replace(/["”″]/g, '') + '″';
  m = n.match(/(\d+\/\d+)″/); if (m) return m[1] + '″'; m = n.match(/(\d+(?:,\d+)?) мм/); return m ? dec(m[1]) : null; }
const lengthOf = n => /подовж|\bXL\b|\bSXL\b/i.test(n) ? 'Подовжений' : /коротк|\bSPKS\b/i.test(n) ? 'Короткий' : 'Стандартний';
function coat(n) { const c = []; if (/Multicolour/i.test(n)) c.push('Multicolour (кольорове кодування)'); if (/BlackLaser/i.test(n)) c.push('BlackLaser'); if (/хромован/i.test(n)) c.push('Хромоване');
  if (/нержав|Stainless/i.test(n)) c.push('Нержавіюча сталь'); if (/цинков/i.test(n)) c.push('Цинкове фосфатування'); return c; }
function feat(n) { const f = []; if (/кульков/i.test(n)) f.push('Кулькова головка'); if (/фіксуюч|\bHF\b/i.test(n)) f.push('З фіксуючою функцією (HF)'); if (/Hex-Plus/i.test(n)) f.push('Профіль Hex-Plus'); if (/Magnet/i.test(n)) f.push('З магнітом'); return f; }
const out = [], disputed = [];
for (const it of I) { const n = norm(it.title); const isSet = /^Набір/i.test(n) || it.secs[0] === 1164 || it.secs[0] === 1165;
  const ps = profiles(n); const v = { a: it.a, title: it.title, secs: it.secs, kind: !isSet, vyd: [isSet ? 'Набір Г-подібних ключів' : 'Г-подібний ключ'], profile: ps.map(p => PROF[p]), size: [], len: [lengthOf(n)], coat: coat(n), feat: feat(n) };
  if (!isSet) { if (ps.length !== 1) disputed.push({ a: it.a, sec: it.secs[0], what: 'Профіль', why: 'не определён однозначно (' + ps.join('/') + ')', title: it.title });
    else { const s = size(it, ps[0]); if (s) v.size = [s]; else disputed.push({ a: it.a, sec: it.secs[0], what: 'Розмір ключа', why: 'нет в таблице и названии', title: it.title }); } }
  else if (!ps.length) disputed.push({ a: it.a, sec: it.secs[0], what: 'Профіль', why: 'набор: профиль не указан в названии', title: it.title });
  out.push(v); }
module.exports = { out, disputed };
if (require.main === module) { const c = k => { const m = {}; for (const v of out) for (const x of v[k]) m[x] = (m[x] || 0) + 1; return m; };
  console.log('items', out.length, 'keys', out.filter(v => v.kind).length, 'disputed', disputed.length); for (const k of ['vyd', 'profile', 'len', 'coat', 'feat']) console.log(k, c(k));
  const { cmp } = require('../lib/valsort.js'); console.log('size', Object.keys(c('size')).sort(cmp).join(' · ')); console.log(disputed.map(d => `${d.a} ${d.sec} ${d.what}: ${d.why} | ${d.title.slice(0, 90)}`).join('\n')); }
