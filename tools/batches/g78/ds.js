// Datasheet page-1 parts: title, series, feature bullets (wrapped lines joined), description paragraph.
const fs = require('fs'), path = require('path');
const DS = path.join(__dirname, '../../batch/ds');
function parse(a) {
  const L = fs.readFileSync(path.join(DS, a + '.txt'), 'utf8').split('\n').filter(l => l.startsWith('p1 ')).map(l => l.slice(3).trim());
  const title = L[0] + (/^[a-zа-я0-9x]/.test(L[1]) && !/^EAN/.test(L[1]) ? ' ' + L[1] : '');
  const series = ((L.find(l => /№ артикула:/.test(l)) || '').split('№ артикула: |')[1] || '').split('|')[0].trim();
  let i = L.findIndex(l => /^тарифа:/.test(l)) + 1; const end = L.findIndex((l, k) => k >= i && /^Ссылка$/.test(l));
  const body = L.slice(i, end < 0 ? undefined : end);
  // feature bullets: short lines before the description paragraph; a line starting lower-case continues the previous one
  const feats = []; let k = 0;
  for (; k < body.length; k++) {
    const l = body[k];
    if (feats.length && /^[a-zа-яё(«"]/.test(l)) { feats[feats.length - 1] += ' ' + l; continue; }
    if (l.length > 100 && body[k + 1] && body[k + 1].length > 60) break; // start of the paragraph
    feats.push(l);
  }
  const desc = body.slice(k).join(' ').replace(/- (?=[а-я])/g, '').replace(/\s+/g, ' ').trim();
  return { title: title.replace(/\s+/g, ' '), series, feats: feats.map(f => f.replace(/\s+/g, ' ').replace(/\.$/, '').trim()), desc };
}
module.exports = { parse };
