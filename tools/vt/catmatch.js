// A set position without an article (neither in the datasheet nor on wera.de) -> OUR product by series + size + length, only on a FULL match
// (owner 10.11.2026, docs/report_1109_blocks.md п. 3): the series code of the datasheet head (851/4 IMP DC) stands in our title as a word sequence,
// the profile of the size (PH, PZ, TX …) is in the title after the code, and EVERY number of the size (size, length, thickness) is the same, in order
// («00» ≠ «0», «4» = «4,0»); exactly one product of the catalog matches, else null (a doubt -> the WERA picture through the owner).
//   const CM = require('./catmatch.js')(products); CM.match(code, size) -> article | null
const PROF = /\b(PH|PZ|TX|IPR|IP|SL|HEX|TORQ|TRI)\b/;
const nums = s => (s.match(/\d+(?:[.,]\d+)?/g) || []).map(n => /[.,]/.test(n) ? String(parseFloat(n.replace(',', '.'))) : n);
const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
module.exports = products => {
  const list = products.map(p => ({ art: p.article, t: String((p.mod_title || {}).ua || p.title && p.title.ua || '').replace(/\s+WERA\s+\d{11}\s*$/, '') }));
  return { match(code, size) {
    // «851/4 IMP DC Impaktor» -> «851/4 IMP DC»; «86 Ni» stays «86 Ni» (nickel-plated — not our Vario 86)
    code = (String(code || '').match(/^\d{2,4}(?:\/\d+)*(?:\s[A-Za-z]{1,5}(?=\s|$))*/) || [''])[0];
    if (!code || !size) return null; const re = new RegExp('(?:^|\\s)' + esc(code.trim()).replace(/\s+/g, '\\s+') + '(?=\\s|,|$)');
    const want = nums(size), pr = (size.match(PROF) || [])[1]; if (want.length < 2) return null;   // size and length at least
    const hit = list.filter(x => { const m = x.t.match(re); if (!m) return false; const tail = x.t.slice(m.index + m[0].length);
      if (pr && !new RegExp('\\b' + pr + '\\b').test(tail)) return false;
      // no other series letters between the code and the size: «855/4» is not «855/4 Z», «9506» is not «9506 SB»
      const lead = tail.split(/\d|#/)[0].replace(PROF, ' '); if (/(?:^|[\s,])[A-Z]{1,4}(?=[\s,]|$)/.test(lead)) return false;
      return JSON.stringify(nums(tail)) === JSON.stringify(want); });
    return hit.length === 1 ? hit[0].art : null; } };
};
