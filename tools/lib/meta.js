// SEO meta description from a product text: whole phrases only, ≤ max chars, never cut inside a word.
// 1) as many whole sentences as fit; 2) else the first sentence's clauses (split at ", " " — " ": " "; ") that fit, closed with "."
// 3) else words up to the limit, closed with "…". Tags are stripped first.
function metaOf(html, max = 160) {
  const s = String(html).replace(/<\/p>\s*<p>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = s.match(/[^.!?]+(?:[.!?]+|$)(?=\s|$)/g)?.map(x => x.trim()).filter(Boolean) || [s];
  let out = '';
  for (const x of sentences) { const next = out ? out + ' ' + x : x; if (next.length > max) break; out = next; }
  if (out) return out;
  const first = sentences[0].replace(/[.!?]+$/, '');
  const parts = first.split(/(?=, | — | – |: |; )/); let acc = '';
  for (const p of parts) { if ((acc + p).length + 1 > max) break; acc += p; }
  if (acc && acc.length >= 60) return acc.replace(/[,;:—–\s]+$/, '') + '.';
  const words = first.split(' '); acc = '';
  for (const w of words) { if ((acc ? acc + ' ' + w : w).length + 1 > max) break; acc = acc ? acc + ' ' + w : w; }
  return acc.replace(/[,;:—–\s]+$/, '') + '…';
}
module.exports = { metaOf };
