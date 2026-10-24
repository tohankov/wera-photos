// live preview of the set block, variant (в): node build.js <SP/setv> <out.html>
const fs = require('fs'); const T = 'C:/Users/Techlight/Desktop/wera-photos/tools/';
const SB = require(T + 'vt/setblock.js'); const W = require(T + 'vt/wset.js'); const C = require(T + 'cat/ds_comp_all.json');
const [, , D, OUT] = process.argv; const E = Object.fromEntries(require(D + '/exp.json').map(p => [p.article, p]));
const SETS = ['05150153001', '05051012001'];
// a position that is not on our site and has no article: name from the datasheet / wera.de (UA — translation of the datasheet RU)
const NOART = { 'KNIPEX': { ua: 'Сантехнічні кліщі KNIPEX Cobra® 87 01 250', ru: 'Сантехнические клещи KNIPEX Cobra® 87 01 250', img: 'wera_knipex_cobra_hightech_wasserpumpenzange_87_01_250' } };
const uri = f => 'data:image/webp;base64,' + fs.readFileSync(D + '/th/' + f + '.webp').toString('base64');
const out = {}; const notes = [];
for (const s of SETS) { const seen = new Set(); const items = [];
  for (const g of C[s]) for (const x of g.items) { const key = x.art || g.head; if (seen.has(key)) continue; seen.add(key);
    if (x.art) { const p = E[x.art]; const vis = p && +p.display_in_showcase === 1;
      const nm = l => SB.withCode(SB.baseName(p.mod_title[l], x.art), g.code);
      items.push({ art: x.art, qty: x.qty, size: SB.size(x.size, p.mod_title.ua), name: { ua: nm('ua'), ru: nm('ru') }, href: vis ? { ua: p.link, ru: p.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/') } : null, img: uri(x.art) }); }
    else { const k = Object.keys(NOART).find(k => g.head.includes(k)); if (!k) { notes.push(s + ' no-article position without a name: ' + g.head); continue; }
      items.push({ art: null, qty: x.qty, size: '', name: { ua: NOART[k].ua, ru: NOART[k].ru }, href: null, img: uri(NOART[k].img) }); } }
  // datasheet vs wera.de «Werkzeuge in diesem Set»
  const w = W.parse(fs.readFileSync(D + '/w_' + s + '.html', 'utf8')).items.filter(i => i.rows.length).flatMap(i => i.rows);
  const da = items.filter(i => i.art).map(i => i.art + ':' + i.qty).sort().join(','), wa = w.filter(r => r.art).map(r => r.art + ':' + r.qty).sort().join(',');
  notes.push(`${s}: datasheet ${items.length} positions, wera.de ${w.length}; articles+qty ${da === wa ? 'EQUAL' : 'DIFFER'}`);
  const txt = fs.readFileSync(T + 'batch/ds/' + s + '.txt', 'utf8'); const count = +((txt.match(/(\d+) предмет/) || [])[1] || 0) || undefined;
  out[s] = { title: E[s].mod_title, link: E[s].link, count, n: items.length, html: { ua: SB.block(items.map(i => ({ ...i, href: i.href && i.href.ua })), 'ua', { count }), ru: SB.block(items.map(i => ({ ...i, href: i.href && i.href.ru })), 'ru', { count }) } }; }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const page = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Склад набору — пілот (в)</title>
<style>
:root{--bg:#111;--panel:#191816;--text:#ededed;--muted:#999;--green:#1e9676;--line:#363434}
body{margin:0;background:var(--bg);color:var(--text);font-family:Roboto,Arial,sans-serif}
.bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 16px;background:#000;border-bottom:1px solid var(--line)}
.bar b{margin-right:6px;font-size:13px;color:var(--muted)} .bar button{background:#262523;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
.bar button.on{background:var(--green);border-color:var(--green);color:#fff}
.set{margin:24px auto;padding:0 16px;max-width:1000px} .set h2{font-size:15px;font-weight:600;margin:0 0 4px} .set .sub{font-size:12px;color:var(--muted);margin:0 0 12px}
.frame{margin:0 auto;background:var(--panel);border:1px dashed #444;padding:16px;transition:width .2s;box-sizing:content-box}
.text{font-size:14px;line-height:1.5}.text a{color:var(--green)}.text h3{font-size:20px;margin:0 0 12px}
.lang-ru .ua,.lang-ua .ru{display:none}
</style></head><body class="lang-ua">
<div class="bar"><b>Мова</b><button data-l="ua" class="on">UA</button><button data-l="ru">RU</button><b style="margin-left:12px">Ширина</b><button data-w="590" class="on">Компʼютер · 590 px (опис на сайті)</button><button data-w="328">Телефон · 328 px (360 px екран)</button></div>
${SETS.map(s => `<div class="set"><h2>${esc(out[s].title.ua)}</h2><p class="sub">${s} · позицій у складі: ${out[s].n} · ${out[s].n > 10 ? 'видно 8, решта під «Показати весь склад»' : 'до 10 позицій — усе одразу, без кнопки'} · <a href="${out[s].link}" style="color:var(--green)">товар на сайті</a></p>
<div class="frame" style="width:590px"><div class="text ua">${out[s].html.ua}</div><div class="text ru">${out[s].html.ru}</div></div></div>`).join('\n')}
<script>
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{document.body.className='lang-'+b.dataset.l;document.querySelectorAll('[data-l]').forEach(x=>x.classList.toggle('on',x===b))});
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.frame').forEach(f=>f.style.width=b.dataset.w+'px');document.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))});
</script></body></html>`;
fs.writeFileSync(OUT, page); fs.writeFileSync(D + '/blocks.json', JSON.stringify(Object.fromEntries(SETS.map(s => [s, { count: out[s].count, html: out[s].html }])), null, 1));
console.log(notes.join('\n')); console.log('size', (page.length / 1024 | 0) + ' KB');
for (const s of SETS) console.log(s, out[s].html.ua.replace(/<img[^>]+>/g, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, '|').replace(/\|+/g, ' | ').slice(0, 1800));
