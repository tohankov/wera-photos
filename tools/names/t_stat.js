const C = require('./catalog.json'); const { apply } = require('./rules.js'); const S = require('./series.js');
let withDs = 0, withModel = 0, hasM = 0; const miss = [], byModel = {};
for (const p of C) { const f = S.facts(p.article); if (!f) continue; withDs++; if (!f.model) continue; withModel++; const ua = apply(p.title.ua, p.article).t;
  const ok = S.hasModel(ua, f.model); if (ok) hasM++; else miss.push([p.article, f.model, ua, (p.parent.value || '').split('/').pop()]);
  (byModel[f.model] = byModel[f.model] || { ok: 0, bad: 0 })[ok ? 'ok' : 'bad']++; }
console.log({ withDs, withModel, hasM, miss: miss.length });
const noTpl = miss.filter(m => !byModel[m[1]].ok); console.log('miss with a correct sibling', miss.length - noTpl.length, 'without', noTpl.length);
const sec = {}; for (const m of miss) sec[m[3]] = (sec[m[3]] || 0) + 1; console.log(Object.entries(sec).sort((a, b) => b[1] - a[1]).slice(0, 40));
for (const m of miss.filter((_, i) => i % 15 === 0)) console.log(m.join(' | '));
