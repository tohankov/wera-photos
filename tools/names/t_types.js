const C = require('./catalog.json'); const { fix } = require('./types.js'); let n = 0; const ex = {};
for (const p of C) { const f = fix(p.title.ua, p.title.ru); if (f.hit.length) { n++; const k = f.hit.join(); (ex[k] = ex[k] || []).push(p.title.ua + ' -> ' + f.ua + (f.ru !== p.title.ru ? '  ||RU ' + p.title.ru + ' -> ' + f.ru : '')); } }
console.log(n); for (const [k, v] of Object.entries(ex)) { console.log('==', k, v.length); console.log(v.slice(0, 6).join('\n')); }
