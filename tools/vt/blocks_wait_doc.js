// Sets of a group whose «Склад набору» block waits (CLAUDE.md: a block only when every position has a main photo without background) -> markdown list:
// per set — the components whose main photo still has a background, by the component's section (they come with the photos of that group), and the
// positions without our product (no article in the datasheet / article not in our catalog: wera.de article + WERA photo through the owner).
//   node vt/blocks_wait_doc.js <all.json> <comp_state.json> <plan_wait.json> <menu_tree.json> <out.md> "<title>"
const fs = require('fs'); const [, , ALL, STF, WF, MENU, OUT, TITLE] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const ST = JSON.parse(fs.readFileSync(STF, 'utf8'));
const WT = JSON.parse(fs.readFileSync(WF, 'utf8')); const M = Object.fromEntries(JSON.parse(fs.readFileSync(MENU, 'utf8')).map(x => [+x.id, x.path.trim()]));
const sec = a => { const p = L[a]; const id = p && p.parent && +(p.parent.id || p.parent); return M[id] || 'раздел ' + id; };
const esc = s => String(s).replace(/\|/g, '/');
const rows = WT.wait.map(w => { const v = ST.sets[w.art]; const by = {}, no = [];
  for (const c of v.comps) { if (['cut', 'knipex'].includes(c.state)) continue;
    if (!c.art || c.state === 'not ours') { no.push(c.art || c.head.slice(0, 60)); continue; } const k = sec(c.art); by[k] = (by[k] || 0) + 1; }
  const why = [...Object.entries(by).map(([k, n]) => `фото раздела «${k}» — ${n}`), ...(no.length ? ['нет нашего товара: ' + no.join('; ')] : [])];
  return `| ${w.art} | ${esc(v.name.slice(0, 70))} | ${esc(why.join('<br>'))} |`; });
const q = WT.questions.map(x => `| ${x.art} | ${esc(x.name.slice(0, 70))} | ${esc(x.q.join('<br>').slice(0, 600))} |`);
fs.writeFileSync(OUT, `# ${TITLE}: наборы, где блок состава ждёт (${new Date().toISOString().slice(0, 10)})\n\nБлок пишется, когда у каждой позиции главное фото без фона. Здесь — что мешает (${rows.length}).\n\n| Набор | Название | Что ждёт |\n|---|---|---|\n${rows.join('\n')}\n`
  + (q.length ? `\n## Вопросы (${q.length})\n\n| Набор | Название | Вопрос |\n|---|---|---|\n${q.join('\n')}\n` : ''));
console.log(OUT, 'wait', rows.length, 'questions', q.length);
