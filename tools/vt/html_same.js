// Is a description the same HTML after the admin's visual editor saved it? (owner 25.10.2026, editor test on 05136032001)
// The editor re-serialises: entities (’ -> &rsquo;), CRLF between blocks, attributes in alphabetical order, img loading="lazy", style type="text/css".
// Those are ignored; every other difference (a tag, an attribute value, text) is reported.
//   sameHtml(a, b) -> [] (same) | ['token i: a || b', ...];  node vt/html_same.js <a.html> <b.html>
const ENT = { rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', ndash: '–', mdash: '—', nbsp: ' ', times: '×', quot: '"', amp: '&', lt: '<', gt: '>', hellip: '…', deg: '°', asymp: '≈', le: '≤', ge: '≥', prime: '′', Prime: '″', reg: '®', trade: '™', middot: '·', '#039': "'" };
const norm = s => String(s).replace(/&(#\d+|#x[0-9a-f]+|[a-zA-Z]+\d*);/g, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? m))
  .replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/\s*;\s*/g, ';').replace(/\s*:\s*/g, ':').replace(/;"/g, '"').trim();
const IGNORE = (tag, attr) => attr === 'loading' || (tag === 'style' && attr === 'type');
const toks = s => { const out = []; for (const m of norm(s).matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g)) { if (m[4]) { const t = m[4].trim(); if (t) out.push('T:' + t); continue; }
    const tag = m[2].toLowerCase(); const attrs = [...m[3].matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)].filter(a => !IGNORE(tag, a[1])).map(a => a[1] + '=' + (a[2] ?? '')).sort();
    out.push((m[1] ? '/' : '') + tag + (attrs.length ? ' ' + attrs.join(' ') : '')); } return out; };
function sameHtml(a, b) { const x = toks(a), y = toks(b); const d = []; for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) d.push(`${i}: ${(x[i] || '—').slice(0, 140)} || ${(y[i] || '—').slice(0, 140)}`); return d; }
module.exports = { sameHtml, norm, toks };
if (require.main === module) { const fs = require('fs'); const d = sameHtml(fs.readFileSync(process.argv[2], 'utf8'), fs.readFileSync(process.argv[3], 'utf8')); console.log(d.length ? d.length + ' diffs\n' + d.slice(0, 20).join('\n') : 'SAME'); }
