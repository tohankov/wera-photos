// live preview of the grouped set block (owner 24.10.2026): node vt/setg_build.js <SP/setv> <live.json> <icons dir> <out.html> [set ...]
// <SP/setv>: exp.json (vt/setv_exp.js), th/<art>.webp (vt/setv_photos.js), w_<set>.html (wera.de page); <live.json> — export with characteristics.
// Icons are embedded as data: URIs (icon-sl.png is not on the site yet). Prints the groups and every question (positions that are not grouped).
const fs = require('fs'); const T = 'C:/Users/Techlight/Desktop/wera-photos/tools/';
const SB = require(T + 'vt/setblock.js'); const G = require(T + 'vt/setgroup.js'); const W = require(T + 'vt/wset.js'); const C = require(T + 'cat/ds_comp_all.json');
const [, , D, LIVE, ICONS, OUT, ...argSets] = process.argv; const SETS = argSets.length ? argSets : ['05150153001'];
const E = Object.fromEntries(require(D + '/exp.json').map(p => [p.article, p])); const L = Object.fromEntries(require(LIVE).map(p => [p.article, p]));
// KNIPEX positions (owner 25.10.2026): our KNIPEX product on techlight-shop.com.ua — the name links there (RU — its /ru/ page), the picture is its main photo without
// background (cut here, served from images/setblock/ in the repo), «Арт. <KNIPEX article>»; not on techlight-shop — the WERA picture without a link
const KN = 'https://techlight-shop.com.ua/vysokotekhnolohichni-santekhnichni-klishchi-cobra-knipex-87-01-250/';
const NOART = { 'KNIPEX': { art: '87 01 250', ua: 'Високотехнологічні сантехнічні кліщі Cobra® 250 мм KNIPEX', ru: 'Высокотехнологичные сантехнические клещи 250 мм KNIPEX Cobra®', href: { ua: KN, ru: KN.replace('techlight-shop.com.ua/', 'techlight-shop.com.ua/ru/') }, img: 'knipex_87_01_250', site: 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/setblock/knipex_87_01_250.png' } };
const uri = f => 'data:image/webp;base64,' + fs.readFileSync(D + '/th/' + f + '.webp').toString('base64');
const icon = f => 'data:image/png;base64,' + fs.readFileSync(ICONS + '/' + f + '.png').toString('base64');
const out = {}; const notes = [], questions = [];
for (const s of SETS) { const seen = new Set(); const items = [];
  for (const g of C[s]) for (const x of g.items) { const key = x.art || g.head; if (seen.has(key)) continue; seen.add(key);
    const gr = G.group(x.art ? L[x.art] : null, g.head); if (gr.question) { questions.push(`${s} ${x.art || '—'} ${g.head}: ${gr.question}`); continue; }
    if (x.art) { const p = E[x.art]; const vis = p && +p.display_in_showcase === 1;
      const nm = l => SB.withCode(SB.baseName(p.mod_title[l], x.art), g.code);
      items.push({ art: x.art, qty: x.qty, gkey: gr.key, size: SB.size(x.size, p.mod_title.ua, gr.key), name: { ua: nm('ua'), ru: nm('ru') }, href: vis ? { ua: p.link, ru: p.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/') } : null, img: uri(x.art) }); }
    else { const k = Object.keys(NOART).find(k => g.head.includes(k)); if (!k) { questions.push(`${s} no-article position without a name: ${g.head}`); continue; }
      items.push({ art: NOART[k].art || null, qty: x.qty, gkey: gr.key, size: '', name: { ua: NOART[k].ua, ru: NOART[k].ru }, href: NOART[k].href || null, img: uri(NOART[k].img) }); } }
  const w = W.parse(fs.readFileSync(D + '/w_' + s + '.html', 'utf8')).items.filter(i => i.rows.length).flatMap(i => i.rows);
  const da = items.filter(i => /^\d{11}$/.test(i.art || '')).map(i => i.art + ':' + i.qty).sort().join(','), wa = w.filter(r => r.art).map(r => r.art + ':' + r.qty).sort().join(',');
  notes.push(`${s}: datasheet ${items.length} positions, wera.de ${w.length}; articles+qty ${da === wa ? 'EQUAL' : 'DIFFER'}`);
  const keys = [...new Set(items.map(i => i.gkey))]; notes.push('  groups: ' + [...keys.filter(k => !k.startsWith('c:')), ...keys.filter(k => k.startsWith('c:'))].map(k => `${k} ${items.filter(i => i.gkey === k).length}`).join(', '));
  const txt = fs.readFileSync(T + 'batch/ds/' + s + '.txt', 'utf8'); const count = +((txt.match(/(\d+) предмет/) || [])[1] || 0) || undefined;
  const html = l => SB.blockG(items.map(i => ({ ...i, href: i.href && i.href[l] })), l, { count, iconSrc: icon });
  out[s] = { title: E[s].mod_title, link: E[s].link, count, n: items.length, html: { ua: html('ua'), ru: html('ru') } }; }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const page = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Склад набору — групи</title>
<style>
:root{--bg:#111;--panel:#191816;--text:#ededed;--muted:#999;--green:#1e9676;--line:#363434}
body{margin:0;background:var(--bg);color:var(--text);font-family:Roboto,Arial,sans-serif}
.bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 16px;background:#000;border-bottom:1px solid var(--line)}
.bar b{margin-right:6px;font-size:13px;color:var(--muted)} .bar button{background:#262523;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
.bar button.on{background:var(--green);border-color:var(--green);color:#fff}
.set{margin:24px auto;padding:0 16px;max-width:1000px} .set h2{font-size:15px;font-weight:600;margin:0 0 4px} .set .sub{font-size:12px;color:var(--muted);margin:0 0 12px}
.frame{margin:0 auto;background:var(--panel);border:1px dashed #444;padding:16px;transition:width .2s;box-sizing:content-box;max-width:calc(100vw - 66px)}
.text{font-size:14px;line-height:1.5}.text a{color:var(--green)}.text h3{font-size:20px;margin:0 0 12px}
.lang-ru .ua,.lang-ua .ru{display:none}
</style></head><body class="lang-ua">
<div class="bar"><b>Мова</b><button data-l="ua" class="on">UA</button><button data-l="ru">RU</button><b style="margin-left:12px">Ширина</b><button data-w="590" class="on">Компʼютер · 590 px (опис на сайті)</button><button data-w="328">Телефон · 328 px (360 px екран)</button></div>
${SETS.map(s => `<div class="set"><h2>${esc(out[s].title.ua)}</h2><p class="sub">${s} · позицій у складі: ${out[s].n} · ${out[s].n > 10 ? 'видно цілі групи до 10 позицій, решта під «Показати весь склад»' : 'до 10 позицій — усе одразу'} · <a href="${out[s].link}" style="color:var(--green)">товар на сайті</a></p>
<div class="frame" style="width:590px"><div class="text ua">${out[s].html.ua}</div><div class="text ru">${out[s].html.ru}</div></div></div>`).join('\n')}
<script>
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{document.body.className='lang-'+b.dataset.l;document.querySelectorAll('[data-l]').forEach(x=>x.classList.toggle('on',x===b))});
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.frame').forEach(f=>f.style.width=b.dataset.w+'px');document.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))});
</script></body></html>`;
fs.writeFileSync(OUT, page);
// the block with site URLs (icons in /content/uploads/images/icons/, pictures — the current main photo of the product; a position not on our site —
// the WERA picture by URL) — only for the admin editor test (vt/details_test.js); the real block takes the cut-out main photos after the photo step
const site = {}; for (const s of SETS) { const its = []; const seen = new Set();
  for (const g of C[s]) for (const x of g.items) { const key = x.art || g.head; if (seen.has(key)) continue; seen.add(key); const gr = G.group(x.art ? L[x.art] : null, g.head); if (gr.question) continue;
    if (x.art) { const p = E[x.art]; its.push({ art: x.art, qty: x.qty, gkey: gr.key, size: SB.size(x.size, p.mod_title.ua, gr.key), name: { ua: SB.withCode(SB.baseName(p.mod_title.ua, x.art), g.code), ru: SB.withCode(SB.baseName(p.mod_title.ru, x.art), g.code) }, href: +p.display_in_showcase === 1 ? { ua: p.link, ru: p.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/') } : null, img: (p.images || [])[0] || null }); }
    else { const k = Object.keys(NOART).find(k => g.head.includes(k)); if (k) its.push({ art: NOART[k].art || null, qty: x.qty, gkey: gr.key, size: '', name: { ua: NOART[k].ua, ru: NOART[k].ru }, href: NOART[k].href || null, img: NOART[k].site }); } }
  site[s] = { count: out[s].count, html: Object.fromEntries(['ua', 'ru'].map(l => [l, SB.blockG(its.map(i => ({ ...i, href: i.href && i.href[l] })), l, { count: out[s].count })])) }; }
fs.writeFileSync(D + '/blocks_g.json', JSON.stringify(site, null, 1));
console.log(notes.join('\n')); console.log('questions:', questions.length ? '\n  ' + questions.join('\n  ') : 0); console.log('size', (page.length / 1024 | 0) + ' KB');
