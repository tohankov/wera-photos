// Old composition pictures in a set description (owner 10.11.2026, 05057460001): a <p> that holds only pictures — bare <img> (rule of 26.10.2026) or
// <a href><img></a> (the lightbox form the old screenshots used; the first rule missed it). A linked picture counts only when its file is the WERA
// composition screenshot of our upload — /content/uploads/images/<n>/<11-digit article>[-N].png; other linked pictures (05134015001
// «vorteil_gitarre_*.jpeg» — photos in use) stay. Icons (/content/uploads/images/icons/) never count.
//   const { strip, find } = require('./oldpic.js'); strip(html) -> html without them; find(html) -> [src ...]
const SHOT = /\/content\/uploads\/images\/\d+\/\d{11}(?:-\d+)?\.png$/i;
const P = /<p>((?:\s*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?\s*)+)<\/p>/g;
const pics = inner => [...inner.matchAll(/(<a\b[^>]*>\s*)?<img\b[^>]*src="([^"]+)"[^>]*>/g)].map(m => ({ linked: !!m[1], src: m[2] }));
const old = inner => { const p = pics(inner); return p.length && p.every(x => !/\/images\/icons\//.test(x.src) && (!x.linked || SHOT.test(x.src.replace(/^https?:\/\/[^/]+/, '')))); };
const strip = h => String(h).replace(P, (m, inner) => old(inner) ? '' : m);
const find = h => [...String(h).matchAll(P)].filter(m => old(m[1])).flatMap(m => pics(m[1]).map(x => x.src));
module.exports = { strip, find, SHOT };
