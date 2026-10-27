// Step б) of the global check — the «до → после» example page for the owner (nothing is written to the site): per product the planned changes from the
// group's plans (names set.json, characteristics plan, description plan, phrase plan, set block), the main photo before / after the cut on the site's dark
// background, the description before / after (UA / RU, 590 px and phone width). Pictures are embedded (data URIs) — the page is a single file.
//   node cat/global_example.js <config.json> <out.html>
// config: { title, intro, live (export with all fields), products: [{ art, kind }], names, chars: {art: {key: [values]}}, desc: [plan.json ...],
//           blocks: {art: {ua, ru}}, photos: {art: {before, after, wera: n}}, notes: {art: [..]}, sections: [{ h, html }] }
const fs = require('fs'), path = require('path'); const [, , CF, OUT] = process.argv; const C = JSON.parse(fs.readFileSync(CF, 'utf8'));
const L = Object.fromEntries(JSON.parse(fs.readFileSync(C.live, 'utf8')).map(p => [p.article, p])); const N = C.names ? JSON.parse(fs.readFileSync(C.names, 'utf8')) : {};
const D = {}; for (const f of C.desc || []) { const P = JSON.parse(fs.readFileSync(f, 'utf8')); for (const [a, x] of Object.entries(P.products)) D[a] = D[a] ? { old: D[a].old, new: applyNext(D[a], x), why: [...D[a].why, ...x.why] } : x; }
// a later plan was built from the live description; applied after the earlier one by replaying its change on the earlier result (same old -> new text)
function applyNext(prev, x) { const out = {}; for (const l of ['ua', 'ru']) out[l] = prev.new[l] === x.old[l] ? x.new[l] : merge(prev.new[l], x.old[l], x.new[l]); return out; }
function merge(base, o, n) { let i = 0; while (i < o.length && o[i] === n[i]) i++; let j = 0; while (j < o.length - i && o[o.length - 1 - j] === n[n.length - 1 - j]) j++;
  const from = o.slice(i, o.length - j), to = n.slice(i, n.length - j); const k = base.indexOf(from); if (from && k >= 0) return base.slice(0, k) + to + base.slice(k + from.length);
  const pre = o.slice(Math.max(0, i - 60), i); const kk = base.indexOf(pre); return kk >= 0 ? base.slice(0, kk + pre.length) + to + base.slice(kk + pre.length + from.length) : base; }
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const uri = f => f && fs.existsSync(f) ? `data:image/${/\.png$/i.test(f) ? 'png' : /\.webp$/i.test(f) ? 'webp' : 'jpeg'};base64,` + fs.readFileSync(f).toString('base64') : '';
const chv = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua).join(', ') || '—';
const TITLE = require('./char_titles.js');
// pictures of the site inside a description: absolute, so the page shows them when opened locally
const abs = h => String(h).replace(/(src|href)="\/(?!\/)/g, '$1="https://tl-shop.com.ua/');
let body = '';
for (const it of C.products) { const a = it.art, p = L[a]; const n = N[a]; const d = D[a]; const rows = [];
  rows.push(['Название UA (title + mod_title)', p.mod_title.ua, n ? n.ua : '', n ? n.why.join('; ') : 'без изменений']);
  rows.push(['Название RU', p.mod_title.ru, n ? n.ru : '', '']);
  for (const [k, v] of Object.entries((C.chars || {})[a] || {})) rows.push([TITLE[k] || k, chv(p, k), v.join(', '), (C.charsWhy || {})[a + '|' + k] || 'паспорт WERA']);
  if (d) rows.push(['Описание UA / RU', '', d.why.join('; '), 'ниже — было / станет']);
  if ((C.blocks || {})[a]) rows.push(['Блок «Склад набору»', (C.blocksNow || {})[a] || 'нет', 'блок с группами по профилям (ниже)', (C.blocksWhy || {})[a] || 'паспорт = wera.de']);
  const ph = (C.photos || {})[a]; if (ph) rows.push(['Фото', `${(p.images || []).length}; главное — на белом`, `главное — без фона${ph.wera ? `; + ${ph.wera} фото WERA` : ''}`, ph.note || '']);
  for (const x of (C.notes || {})[a] || []) rows.push(x);
  body += `<h2>${esc(it.kind)} — ${a} · <a href="${p.link}">витрина</a></h2><p class="m">${esc(p.mod_title.ua)}</p>
<table class="ch"><tr><th>Что</th><th>Сейчас</th><th>Станет</th><th>Источник / почему</th></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td><b>${esc(r[2])}</b></td><td class="m">${esc(r[3])}</td></tr>`).join('')}</table>`;
  if (ph) body += `<div class="ph"><figure><img src="${uri(ph.before)}"><figcaption>главное фото сейчас</figcaption></figure><figure><img src="${uri(ph.after)}"><figcaption>станет — без фона, на тёмном фоне сайта</figcaption></figure></div>`;
  const blk = (C.blocks || {})[a]; if (d || blk) { const nw = { ua: d ? d.new.ua : p.description.ua, ru: d ? d.new.ru : p.description.ru };
    if (blk) for (const l of ['ua', 'ru']) { const i = nw[l].search(/<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)/); nw[l] = i < 0 ? nw[l] + blk[l] : nw[l].slice(0, i) + blk[l] + nw[l].slice(i); }
    body += `<div class="two"><div><p class="m">БЫЛО</p><div class="frame text"><div class="ua">${abs(p.description.ua)}</div><div class="ru">${abs(p.description.ru)}</div></div></div>
<div><p class="m">СТАНЕТ</p><div class="frame text fr"><div class="ua">${abs(nw.ua)}</div><div class="ru">${abs(nw.ru)}</div></div></div></div>`; } }
for (const s of C.sections || []) body += `<h2>${esc(s.h)}</h2>${s.html}`;
const page = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(C.title)}</title>
<style>:root{--bg:#111;--panel:#191816;--text:#ededed;--muted:#999;--green:#1e9676;--line:#363434}body{margin:0;background:var(--bg);color:var(--text);font-family:Roboto,Arial,sans-serif;font-size:14px}
.wrap{max-width:1200px;margin:0 auto;padding:16px}h1{font-size:20px}h2{font-size:17px;margin:36px 0 4px}a{color:var(--green)}.m{color:var(--muted);font-size:12px}
table.ch{width:100%;border-collapse:collapse;margin:10px 0}table.ch td,table.ch th{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}table.ch th{background:#262523}
.ph{display:flex;flex-wrap:wrap;gap:12px}.ph figure{margin:0}.ph img{width:300px;max-width:100%;display:block;border:1px solid var(--line);background:#191816}figcaption{font-size:12px;color:var(--muted);margin-top:4px}
.bar{position:sticky;top:0;z-index:5;background:#000;padding:8px 16px;border-bottom:1px solid var(--line)}.bar button{background:#262523;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:5px 10px;cursor:pointer}.bar button.on{background:var(--green);border-color:var(--green)}
.frame{background:var(--panel);border:1px dashed #444;padding:16px;margin-top:6px;overflow:auto}.text a{color:var(--green)}.text h3{font-size:20px;margin:12px 0}.text table{max-width:100%}.lang-ru .ua,.lang-ua .ru{display:none}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:900px){.two{grid-template-columns:1fr}}</style></head><body class="lang-ua">
<div class="bar">Язык: <button data-l="ua" class="on">UA</button> <button data-l="ru">RU</button> · Ширина «станет»: <button data-w="590" class="on">компьютер 590 px</button> <button data-w="328">телефон 328 px</button></div>
<div class="wrap"><h1>${esc(C.title)}</h1>${C.intro || ''}${body}</div>
<script>document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{document.body.className='lang-'+b.dataset.l;document.querySelectorAll('[data-l]').forEach(x=>x.classList.toggle('on',x===b))});
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.fr').forEach(f=>{f.style.width=b.dataset.w+'px';f.style.boxSizing='content-box'});document.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))});
document.querySelectorAll('.fr').forEach(f=>{f.style.width='590px';f.style.boxSizing='content-box'});</script></body></html>`;
fs.writeFileSync(OUT, page); console.log('example', OUT, (page.length / 1024 | 0) + ' KB');
