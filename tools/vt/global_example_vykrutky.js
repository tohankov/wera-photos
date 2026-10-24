// step б) of the group «Викрутки»: before -> after page for one screwdriver and one set (NOTHING is written). node build_ex.js <SP/g2> <out.html>
const fs = require('fs'); const T = 'C:/Users/Techlight/Desktop/wera-photos/tools/'; const sharp = require(T + 'node_modules/sharp');
const { cut } = require(T + 'lib/cutout.js'); const SB = require(T + 'vt/setblock.js'); const C = require(T + 'cat/ds_comp_all.json');
const [, , D, OUT] = process.argv; const E = Object.fromEntries(require(D + '/ex/exp.json').map(p => [p.article, p])); const L = Object.fromEntries(require(D + '/live.json').map(p => [p.article, p]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = async (u, f) => { if (!fs.existsSync(f)) { await sleep(1500); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error(r.status + ' ' + u); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); } return f; };
const alphaCrop = async b => { const { data, info } = await sharp(b).raw().toBuffer({ resolveWithObject: true }); let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return sharp(b).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer(); };
const uri = (b, t = 'webp') => `data:image/${t};base64,` + b.toString('base64');
const DIR = D + '/ex/img'; fs.mkdirSync(DIR, { recursive: true });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
(async () => {
  // main photo: original on white | without background on the site dark
  const main = {}; for (const a of ['05018264001', '05032060001']) { const f = await get(E[a].images[0], `${DIR}/${a}_main.${E[a].images[0].split('.').pop()}`); const c = await cut(f);
    const o = await sharp(f).flatten({ background: '#fff' }).resize(420, 420, { fit: 'contain', background: '#fff' }).jpeg({ quality: 85 }).toBuffer();
    const n = await sharp(await sharp(c.png).resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).flatten({ background: '#191816' }).jpeg({ quality: 85 }).toBuffer();
    main[a] = { o: uri(o, 'jpeg'), n: uri(n, 'jpeg'), stats: c.stats }; }
  // missing WERA photos (checked by eye on the sheets our | WERA)
  const ADD = { '05018264001': ['https://www.wera.de/prodimg/416x416/abrollschutz.webp'], '05032060001': ['https://www.wera.de/prodimg/1664x1664/praegestempel_3350_ph2.webp'] };
  const add = {}; for (const [a, us] of Object.entries(ADD)) { add[a] = []; for (const u of us) { const f = await get(u, `${DIR}/${a}_add_${u.split('/').pop()}`); add[a].push({ u, img: uri(await sharp(f).resize(220, 220, { fit: 'contain', background: '#fff' }).jpeg({ quality: 85 }).toBuffer(), 'jpeg') }); } }
  // the set block of 05032060001: datasheet composition, our names, main photos without background
  const S = '05032060001'; const items = [];
  for (const g of C[S]) for (const x of g.items) { const p = E[x.art]; const f = await get(p.images[0], `${DIR}/${x.art}.${p.images[0].split('.').pop()}`);
    const th = await sharp(await alphaCrop((await cut(f)).png)).resize(152, 92, { fit: 'inside' }).webp({ quality: 88, alphaQuality: 90 }).toBuffer();
    const nm = l => SB.withCode(SB.baseName(p.mod_title[l], x.art), g.code);
    items.push({ art: x.art, qty: x.qty, size: SB.size(x.size, p.mod_title.ua), name: { ua: nm('ua'), ru: nm('ru') }, href: { ua: p.link, ru: p.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/') }, img: uri(th) }); }
  const count = +((fs.readFileSync(T + 'batch/ds/' + S + '.txt', 'utf8').match(/(\d+) предмет/) || [])[1] || 0) || undefined;
  const block = l => SB.block(items.map(i => ({ ...i, href: i.href[l] })), l, { count });
  const oldShot = uri(fs.readFileSync(D + '/ex/old_shot.png'), 'png');
  const descAfter = l => L[S].description[l].replace(/<p><a href="\/content\/uploads\/images\/05032060001\/05032060001-1\.png">[\s\S]*?<\/a><\/p>/, block(l));
  fs.writeFileSync(D + '/ex/desc_after_05032060001.json', JSON.stringify({ ua: descAfter('ua'), ru: descAfter('ru') }));
  const row = (what, now, then, src) => `<tr><td>${what}</td><td>${now}</td><td><b>${then}</b></td><td class="m">${src}</td></tr>`;
  const T1 = `<table class="ch"><tr><th>Что</th><th>Сейчас</th><th>Станет</th><th>Источник</th></tr>
${row('Название UA (title + mod_title)', esc(E['05018264001'].mod_title.ua), 'Шліцева ударна викрутка SL 1,0×5,5×100 мм WERA 05018264001', 'паспорт: «932 A Шлицевая отвертка, 1 мм x 5.5 мм x 100 мм»; формат «SL товщина×ширина»')}
${row('Название RU', esc(E['05018264001'].mod_title.ru), 'Шлицевая ударная отвертка SL 1,0×5,5×100 мм WERA 05018264001', 'то же')}
${row('Особливості викрутки', '— (нет значений)', 'Шестигранний стрижень; Допоміжний шестигранник', 'wera.de 932 A: «Sechskantklinge», «Sechskantschlüsselhilfe»; у этого артикула сноски «Keine …» нет (есть только у 05018260001 — ему «Допоміжний» не ставится)')}
${row('Фото', '8 (все — фото WERA)', '8 + 1 фото WERA «Abrollschutz» (защита от перекатывания), главное — без фона', 'wera.de: главное + 7 деталей + 1 «в работе»; сверено глазами')}
${row('Таблица «Інші варіанти серії»', 'у иконок в шапке alt = текст столбца (дублируется)', 'alt="" у иконок (UA и RU), строки и ссылки — без изменений', 'п. 8 плана')}
${row('Не меняется', 'раздел 1119, цена, наличие, описание, EAN 4013288018021 (= паспорт), PDF, SEO (свои поля пустые → шаблон)', '', '')}</table>`;
  const T2 = `<table class="ch"><tr><th>Что</th><th>Сейчас</th><th>Станет</th><th>Источник</th></tr>
${row('Название UA', esc(E[S].mod_title.ua), 'Набір викруток з нержавіючої сталі (SL, PH) WERA 05032060001', 'формат CLAUDE.md «(SL, PH, PZ)»')}
${row('Название RU', esc(E[S].mod_title.ru), 'Набор отверток из нержавеющей стали (SL, PH) WERA 05032060001', 'то же')}
${row('Описание UA / RU', 'картинка-скриншот старого каталога WERA (7 строк, PH 1 05032021001 два раза)', 'блок «Склад набору · 6 предметів» (ниже), остальной текст без изменений', 'паспорт = wera.de «Werkzeuge in diesem Set»: 6 позиций, артикулы и количество совпали')}
${row('Фото', '9 (все — фото WERA)', '9 + 1 фото WERA «Prägestempel» (ручка с маркировкой размера), главное — без фона', 'wera.de: 2 главных + 7 деталей + 1 «в работе»; сверено глазами')}
${row('Характеристики', 'Набір викруток; PH у складі: PH 1, PH 2; SL у складі: SL 0,5×3,0, 0,8×4,0, 1,0×5,5, 1,2×6,5; Довжина стрижня 80 / 100 / 125 / 150 мм; Нержавіюча сталь', 'без изменений (генератор = сайт)', '')}
${row('Не меняется', 'раздел 1123, цена, наличие, EAN, PDF, SEO', '', '')}</table>`;
  const ph = a => `<div class="ph"><figure><img src="${main[a].o}"><figcaption>главное фото сейчас (на белом)</figcaption></figure><figure><img src="${main[a].n}"><figcaption>станет — без фона, на фоне сайта</figcaption></figure>${add[a].map(x => `<figure><img src="${x.img}" style="width:220px"><figcaption>добавить: ${esc(x.u.split('/').pop())}</figcaption></figure>`).join('')}</div>`;
  const page = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Викрутки — пример</title>
<style>:root{--bg:#111;--panel:#191816;--text:#ededed;--muted:#999;--green:#1e9676;--line:#363434}body{margin:0;background:var(--bg);color:var(--text);font-family:Roboto,Arial,sans-serif;font-size:14px}
.wrap{max-width:1100px;margin:0 auto;padding:16px}h1{font-size:20px}h2{font-size:17px;margin:32px 0 6px}a{color:var(--green)}.m{color:var(--muted);font-size:12px}
table.ch{width:100%;border-collapse:collapse;margin:10px 0}table.ch td,table.ch th{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}table.ch th{background:#262523}
.ph{display:flex;flex-wrap:wrap;gap:12px}.ph figure{margin:0}.ph img{width:300px;max-width:100%;display:block;border:1px solid var(--line)}figcaption{font-size:12px;color:var(--muted);margin-top:4px}
.bar button{background:#262523;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:5px 10px;cursor:pointer}.bar button.on{background:var(--green);border-color:var(--green)}
.frame{background:var(--panel);border:1px dashed #444;padding:16px;margin-top:10px}.text a{color:var(--green)}.text h3{font-size:20px;margin:12px 0}.lang-ru .ua,.lang-ua .ru{display:none}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:800px){.two{grid-template-columns:1fr}}</style></head><body class="lang-ua"><div class="wrap">
<h1>Группа «Викрутки» — шаг б): пример «до → после» (на сайт НЕ записано)</h1>
<p class="m">Анализ всей группы — docs/global_vykrutky.md. Здесь — 2 товара: одиночная викрутка и набор викруток. Жду «ок» или правки.</p>
<h2>1. Одиночная викрутка — 05018264001 · <a href="${E['05018264001'].link}">витрина</a> · <a href="https://www.wera.de/de/05018264001">wera.de</a></h2>${T1}${ph('05018264001')}
<h2>2. Набор викруток — 05032060001 · <a href="${E[S].link}">витрина</a> · <a href="https://www.wera.de/de/05032060001">wera.de</a></h2>${T2}${ph(S)}
<h2>Описание набора: было → станет</h2>
<div class="bar">Язык: <button data-l="ua" class="on">UA</button> <button data-l="ru">RU</button> · Ширина: <button data-w="590" class="on">компьютер 590 px</button> <button data-w="328">телефон 328 px</button></div>
<div class="two"><div><p class="m">БЫЛО (картинка в описании, UA и RU одинаковая)</p><div class="frame"><img src="${oldShot}" style="max-width:100%"></div></div>
<div><p class="m">СТАНЕТ (весь остальной текст описания не меняется)</p><div class="frame" id="fr" style="width:590px;max-width:100%;box-sizing:border-box"><div class="text ua">${block('ua')}</div><div class="text ru">${block('ru')}</div></div></div></div>
<script>document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{document.body.className='lang-'+b.dataset.l;document.querySelectorAll('[data-l]').forEach(x=>x.classList.toggle('on',x===b))});
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{document.getElementById('fr').style.width=b.dataset.w+'px';document.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))});</script>
</div></body></html>`;
  fs.writeFileSync(OUT, page); console.log('ok', (page.length / 1024 | 0) + ' KB', JSON.stringify(main['05018264001'].stats), JSON.stringify(main[S].stats)); })();
