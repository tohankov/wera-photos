// Owner's upload list for rule В (28.10.2026): which files of images/setblock_wera/ go to /content/uploads/images/icons/ and which sets wait only for them.
//   node vt/noart_doc.js <out.md> <plan_wait.json> [...]
const fs = require('fs'); const [, , OUT, ...WF] = process.argv; const J = require('./noart.json');
const w = WF.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).wait); const f = {}, only = new Set();
for (const x of w) { const fl = x.why.map(y => (y.match(/файл (\S+) не завантажено/) || [])[1]).filter(Boolean); if (fl.length && fl.length === x.why.length) only.add(x.art); for (const k of fl) (f[k] = f[k] || new Set()).add(x.art); }
const nm = {}; for (const e of [...Object.values(J.names), ...Object.values(J.arts), ...Object.values(J.knipex || {})]) nm[e.file] = nm[e.file] || e.ua;
const rows = Object.entries(f).sort((a, b) => b[1].size - a[1].size).map(([k, v]) => `| ${k} | ${nm[k]} | ${v.size} | ${[...v].join(', ')} |`);
fs.writeFileSync(OUT, `# Файлы для блоков состава — загрузить в /content/uploads/images/icons/ (${new Date().toISOString().slice(0, 10)})

Позиции наборов, которых у нас нет как товара (правило В). Картинка — фото WERA с wera.de («Werkzeuge in diesem Set»), фон снят; KNIPEX — главное фото нашего товара на techlight-shop.com.ua, фон снят. Файлы — в репозитории \`images/setblock_wera/\`, лист на тёмном фоне — \`docs/pilot/noart_sheet.jpg\`.

Куда: админка → файловый менеджер → \`/content/uploads/images/icons/\` (туда же, где значки профилей и \`knipex_87_01_250.png\`). Имена файлов не менять.

После загрузки проверю (\`node vt/noart_files.js check\`) и запишу блоки: **${only.size} наборов ждут только эти файлы** (${rows.length} файлов).

| Файл | Что это (UA на сайте) | Наборов | Наборы |
|---|---|---|---|
${rows.join('\n')}

В карточке позиции: название без ссылки (KNIPEX — ссылка на techlight-shop), размер, «Арт. …» — артикул из паспорта / wera.de, если он есть; у полосок на липучках, поясов и сумок WERA артикула не даёт — только «N шт.».

**Вопрос.** У нас есть товары «Смужка на липучці № 1 50×70 мм» (05670446001), № 2 50×120 (05670447001), № 3 50×240 (05670448001) — в их паспортах это «Klettstreifen 1 / 2 / 3». В составе наборов WERA пишет «Klettstreifen 70 / 120 / 240» без артикула. Размер тот же, но название и артикул WERA не совпадают, поэтому ссылку на наш товар не ставлю — показываю фото WERA. Если это одно и то же — скажи, поставлю ссылки на наши полоски (тогда файлы wera_k70 / k120 / k240 не нужны).
`);
console.log(OUT, 'files', rows.length, 'sets waiting only for files', only.size);
