// Owner 11.11.2026 («Інструментальний візок та ложементи»): where the set block goes in, the old text list «Комплектація …» is removed (the block
// replaces it); «Розміри … з інструментом» and «Артикул» stay (under «Характеристики»); the one-sentence «Комплектація: …» at the end of the intro
// paragraph goes too. Also «9x12» -> «9×12» in the block sizes. Post-processes a vt/setblock_plan.js plan in place.   node vt/komp_remove.js <plan.json>
const fs = require('fs'); const f = process.argv[2]; const P = JSON.parse(fs.readFileSync(f)); const pr = P.products || P; const st = { list: 0, sent: 0 };
for (const v of Object.values(pr)) for (const l of ['ua', 'ru']) { const h = v.new[l]; const i = h.indexOf('<div class="wsb"'); if (i < 0) continue;
  let head = h.slice(0, i); const tail = h.slice(i).replace(/(<b[^>]*>)([^<]*)(<\/b>)/g, (m, x, y, z) => x + y.replace(/(\d)x(\d)/g, '$1×$2') + z);
  const KW = l === 'ua' ? 'Комплектація' : 'Комплектация';
  head = head.replace(new RegExp('<p><strong>' + KW + '</strong></p>\\s*<ul>([\\s\\S]*?)</ul>'), (m, ul) => { st.list++;
    // composition lines «350 PH: PH 1x80, …», «162 i VDE PH: …», «368 (квадрат): …» go; «Розміри …», «Артикул», a WERA phrase added later stay
    const keep = [...ul.matchAll(/<li>[\s\S]*?<\/li>/g)].map(x => x[0]).filter(x => !/^<li>\d{2,5}[^<:]{0,30}:/.test(x));
    return keep.length ? '<p><strong>Характеристики</strong></p><ul>' + keep.join('') + '</ul>' : ''; });
  head = head.replace(new RegExp('\\s*' + KW + ':[^<]*?\\.(?=</p>)'), () => { st.sent++; return ''; });
  if (head + tail !== h) { v.new[l] = head + tail; if (!v.why.includes('«Комплектація» → блок')) v.why.push('«Комплектація» → блок'); } }
fs.writeFileSync(f, JSON.stringify(P)); console.log(st);
