// Rule В (owner 28.10.2026): set positions without our product — the WERA picture of the wera.de row («Werkzeuge in diesem Set», prodimg 480×480,
// the only size wera.de serves), background removed (lib/cutout.js) -> images/setblock_wera/wera_<file>.png for the owner to upload into
// /content/uploads/images/icons/ (pictures on the site only from our domain); names UA / RU per wera.de name (RU — the datasheet wording, UA — ours).
// Writes vt/noart.json { names: { <wera.de name>: { ua, ru, file } } } and a sheet on the site's dark background. Read-only for the site.
//   node vt/noart_files.js <noart_resolve out.json> <sheet.jpg>
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , RES, SHEET] = process.argv; const R = RES === 'check' ? null : JSON.parse(fs.readFileSync(RES, 'utf8'));
const DIR = path.join(__dirname, '../../images/setblock_wera'); fs.mkdirSync(DIR, { recursive: true });
const STAIN = { ua: 'нержавіюча сталь', ru: 'нержавеющая сталь' };
const KK = (s) => ({ ua: `Kraftform Kompakt VDE ${s} Take it easy, ${STAIN.ua}`, ru: `Kraftform Kompakt VDE ${s} Take it easy, ${STAIN.ru}` });
// wera.de name -> our UA / RU (RU as the WERA datasheet names it). A name not here is not written (listed).
const N = {
  'Klettstreifen 70': { group: 'c:ACC', ua: 'Набір смужок на липучках 70', ru: 'Набор полосок на липучках 70' },
  'Klettstreifen 120': { group: 'c:ACC', ua: 'Набір смужок на липучках № 120', ru: 'Набор полосок на липучках № 120' },
  'Klettstreifen 240': { group: 'c:ACC', ua: 'Набір смужок на липучках 240', ru: 'Набор полосок на липучках 240' },
  'Klettstreifen 30': { group: 'c:ACC', ua: 'Набір смужок на липучках 30', ru: 'Набор полосок на липучках 30' },
  'Kraftform Kompakt VDE 3067 i TORX® Take it easy, Edelstahl': { group: 'TX', ...KK('3067 i TORX®') },
  'Kraftform Kompakt VDE 3067 iS TORX® Take it easy, Edelstahl': { group: 'TX', ...KK('3067 iS TORX®') },
  'Kraftform Kompakt VDE 3062 iS Take it easy, Edelstahl': { group: 'PH', ...KK('3062 iS') },
  'Kraftform Kompakt VDE 3065 iS PZ Take it easy, Edelstahl': { group: 'PZ', ...KK('3065 iS PZ') },
  'Kraftform Kompakt VDE 3065 iS PZ/S Take it easy, Edelstahl': { group: 'PM', ...KK('3065 iS PZ/S') },
  'Kraftform Kompakt VDE 3060 i Take it easy, Edelstahl': { group: 'SL', ...KK('3060 i') },
  'Kraftform Kompakt VDE 3060 iS Take it easy, Edelstahl': { group: 'SL', ...KK('3060 iS') },
  'Belt B VDE (Textilgurt), 10-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt B VDE (текстильний) на 10 інструментів, без інструментів', ru: 'Belt B VDE (матерчатый), на 10 инструментов, неукомплектованный' },
  '9522 Gürteltasche, leer': { group: 'c:ACC', ua: '9522 Поясна сумка, без інструментів', ru: '9522 Поясная сумка, неукомплектованная' },
  '3247 Einpoliger Phasenprüfer, Edelstahl': { group: 'c:TESTER', ua: '3247 Однополюсний індикатор напруги, нержавіюча сталь', ru: '3247 Однополюсный тестер фазного напряжения, нержавеющая сталь' },
  '9108 Montagewerkzeug für Solar-Steckverbinder MC4': { group: 'c:KEY', ua: '9108 Інструмент для монтажу конекторів MC4', ru: '9108 Инструмент для монтажа коннекторов MC4' },
  '1440 Schraubkralle für Schraubendreherklingen, lange Bits und Winkel': { ua: '1440 Фіксатор гвинтів', ru: '1440 Фиксатор винтов' },
  '1442 Schraubkralle für Schraubendreherklingen, lange Bits und Winkel': { ua: '1442 Фіксатор гвинтів', ru: '1442 Фиксатор винтов' },
  // Zyklop sets (29.10.2026); belts — without the count (wera.de and the datasheet differ: Belt C Impaktor «9-teilig» / «на 6 инструментов»)
  'Belt A (Textilgurt), 9-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt A (текстильний), без інструментів', ru: 'Пояс A (матерчатый), неукомплектованный' },
  'Belt A (Textilgurt), 8-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt A (текстильний), без інструментів', ru: 'Пояс A (матерчатый), неукомплектованный' },
  'Belt B (Textilgurt), 9-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt B (текстильний), без інструментів', ru: 'Belt B (матерчатый), неукомплектованный' },
  'Belt B (Textilgurt), 8-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt B (текстильний), без інструментів', ru: 'Belt B (матерчатый), неукомплектованный' },
  'Belt C (Textilgurt), 6-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt C (текстильний), без інструментів', ru: 'Belt C (матерчатый), неукомплектованный' },
  'Belt C Impaktor (Textilgurt), 9-teilig, unbestückt': { group: 'c:ACC', ua: 'Пояс Belt C Impaktor (текстильний), без інструментів', ru: 'Belt C Impaktor (матерчатый), неукомплектованный' },
  '8001 A Bit-Ratsche 1/4"': { group: 'c:RATCHET', ua: '8001 A Тріскачка для біт Bit Ratchet 1/4″', ru: '8001 A Трещотка для бит Bit Ratchet 1/4″' },
  '8009 Zyklop Pocket': { group: 'c:RATCHET', ua: '8009 Тріскачка Zyklop Pocket', ru: '8009 Трещотка Zyklop Pocket' },
  '8002 C Koloss 1/2"': { group: 'c:RATCHET', ua: '8002 C Тріскачка Koloss 1/2″', ru: '8002 C Трещотка Koloss 1/2″' },
  '8782 C Koloss Pad': { group: 'c:ACC', ua: '8782 C Комплект накладок Koloss', ru: '8782 C Комплект накладок Koloss' },
  'Halfter': { group: 'c:ACC', ua: 'Кобура Holster', ru: 'Кобура Holster' },
  '8798 B Zyklop-Verlängerung, 3/8"': { group: 'c:ACC', ua: '8798 B Подовжувач Zyklop 3/8″', ru: '8798 B Удлинитель Zyklop 3/8″' },
  '3899/4/1 Universalhalter, Edelstahl': { group: 'c:ACC', ua: '3899/4/1 Універсальний тримач, нержавіюча сталь', ru: '3899/4/1 Универсальный держатель, нержавеющая сталь' },
  '9502 Reifenheber mit Bit-Aufnahme': { group: 'c:ACC', ua: '9502 Лопатка-монтажка з бітотримачем', ru: '9502 Лопатка-монтировка с битодержателем' },
  '9503 Reifenheber mit Ventilausdreher': { group: 'c:ACC', ua: '9503 Лопатка-монтажка з вузлом для викручування ніпеля', ru: '9503 Лопатка-монтировка с узлом для вывинчивания ниппеля' },
  '9481 Werkzeugtasche': { group: 'c:ACC', ua: '9481 Сумка для інструментів', ru: '9481 Сумка для инструментов' },
  '9480 Reißverschluss-Etui': { group: 'c:ACC', ua: '9480 Футляр на блискавці', ru: '9480 Футляр на молнии' },
  '9603 Nuss-Magnetleiste Impaktor, 3/8", unbestückt': { group: 'c:ACC', ua: '9603 Магнітний тримач для головок Impaktor 1/2″, без головок', ru: '9603 Магнитный держатель для головок Impaktor, 1/2″, неукомплектованный' },   // owner 29.10.2026: by the datasheet (1/2″)
  '873/1 Five Lobe Bits mit Bohrung': { group: 'FIVE', ua: 'Біти Five Lobe 873/1 з отвором', ru: 'Насадки Five Lobe 873/1 с отверстием' },
  '840/2 Z Bits': { group: 'HEX', ua: 'Біти 840/2 Z', ru: 'Насадки 840/2 Z' },
  '867/4 BTZ TORX® Bits': { group: 'TX', ua: 'Біти TORX® 867/4 BTZ', ru: 'Насадки TORX® 867/4 BTZ' },
  '800/4 BTZ Bits': { group: 'SL', ua: 'Біти 800/4 BTZ', ru: 'Насадки 800/4 BTZ' },
};
// datasheet articles that are not in our catalog (the wera.de row has the same article) — the datasheet name
const NA = {
  '162 iSS': { group: 'PH', ua: '162 iSS VDE Хрестова ізольована викрутка із завуженим робочим кінцем', ru: '162 iSS VDE Крестовая изолированная отвёртка с зауженным рабочим концом' },
  '165 iSS PZ/S': { group: 'PM', ua: '165 iSS PZ/S VDE Ізольована викрутка для гвинтів PlusMinus (Pozidriv/шліц) із завуженим робочим кінцем', ru: '165 iSS PZ/S VDE Изолированная отвёртка для винтов PlusMinus (Pozidriv/шлиц), зауженный рабочий конец' },
  '8767 B TORX®': { group: 'TX', ua: 'Викруткова головка Zyklop 8767 B 3/8″ TORX® з подовженою робочою частиною', ru: 'Отвёрточная головка Zyklop 8767 B 3/8″ TORX® с вытянутой рабочей частью' },
  '8740 B Zyklop': { group: 'HEX', ua: 'Викруткова головка Zyklop 8740 B 3/8″ шестигранна з подовженою робочою частиною', ru: 'Отвёрточная головка Zyklop 8740 B 3/8″ шестигранная с вытянутой рабочей частью' },
  '851/0 Micro': { group: 'PH', ua: 'Біти 851/0 Micro для гвинтів Phillips', ru: 'Насадки 851/0 Micro для винтов Phillips' },
  '9575': { group: 'c:ACC', ua: '9575 М’який чохол Kraftform Kompakt VDE 24 Allrounder 1, без інструментів', ru: '9575 Мягкий чехол Kraftform Kompakt VDE 24 Allrounder 1, без инструментов' },
};
// KNIPEX in a set (owner 25.10.2026): our KNIPEX product on techlight-shop.com.ua — name = its h1 (UA / /ru/), link there, picture = its main photo without
// background; key = the KNIPEX article as the WERA datasheet writes it (matched in the head of the position)
const KNX = { '87 01 250': 'https://techlight-shop.com.ua/vysokotekhnolohichni-santekhnichni-klishchi-cobra-knipex-87-01-250/', '13 96 200': 'https://techlight-shop.com.ua/elektromontazhni-klishchi-knipex-13-96-200/',
  '08 26 185': 'https://techlight-shop.com.ua/pasatyzhi-podovzheni-185-mm-knipex-08-26-185/' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// node vt/noart_files.js check — which files the owner has uploaded (HTTP 200 image from our domain) -> «uploaded» in vt/noart.json
const ICONS = 'https://tl-shop.com.ua/content/uploads/images/icons/';
if (RES === 'check') (async () => { const F = path.join(__dirname, 'noart.json'); const J = JSON.parse(fs.readFileSync(F, 'utf8')); const st = {};
  for (const e of [...Object.values(J.names), ...Object.values(J.arts), ...Object.values(J.knipex || {})]) { if (!(e.file in st)) { await sleep(600); const r = await fetch(ICONS + e.file, { headers: { 'user-agent': 'Mozilla/5.0' } });
      st[e.file] = r.ok && /^image\//.test(r.headers.get('content-type') || ''); } e.uploaded = st[e.file]; }
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); const n = Object.values(st); console.log('files', n.length, 'uploaded', n.filter(Boolean).length, '| missing', Object.keys(st).filter(k => !st[k]).join(' ')); })();
else (async () => { const out = { names: {}, arts: {}, knipex: {} }, miss = [], cells = []; const get = require('./fetchpage.js');
  for (const [k, u] of Object.entries(KNX)) { const file = 'knipex_' + k.replace(/ /g, '_') + '.png'; const e = { group: 'c:PLIERS', file, href: { ua: u, ru: u.replace('.com.ua/', '.com.ua/ru/') } };
    for (const l of ['ua', 'ru']) { await sleep(1500); const h = (await get(e.href[l])).html; e[l] = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
      if (l === 'ua') e.src = ((h.match(/property="og:image" content="([^"]+)"/) || [])[1] || '').replace(/\/content\/images\/(\d+)\/[^/]+\//, '/content/images/$1/'); }
    if (!e.ua || !e.ru || !e.src) { miss.push('KNIPEX ' + k + ': h1 / photo not found'); continue; } out.knipex[k] = e;
    const fp = path.join(DIR, file); if (!fs.existsSync(fp)) { const r = await fetch(e.src, { headers: { 'user-agent': 'Mozilla/5.0' } }); fs.writeFileSync(fp, (await cut(Buffer.from(await r.arrayBuffer()))).png); } }
  for (const o of Object.values(R.pos)) { if (!o.wera) continue; const src = o.wera.img; const file = 'wera_' + path.basename(src).replace(/\.webp$/, '.png');
    let nm = null; if (o.key.startsWith('W:')) nm = N[o.wera.name]; else { const k = Object.keys(NA).find(k => o.head.startsWith(k + ' ')); nm = k && NA[k]; }
    if (!nm) { miss.push(`${o.key.slice(0, 70)} (${o.head.slice(0, 60)})`); continue; }
    if (o.key.startsWith('W:')) out.names[o.wera.name] = { ...nm, file, src }; else out.arts[o.art] = { ...nm, file, src };
    const f = path.join(DIR, file); if (fs.existsSync(f)) continue; await sleep(1200);
    const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) { miss.push('HTTP ' + r.status + ' ' + src); continue; }
    const c = await cut(Buffer.from(await r.arrayBuffer())); fs.writeFileSync(f, c.png); }
  fs.writeFileSync(path.join(__dirname, 'noart.json'), JSON.stringify(out, null, 1));
  const files = [...new Set([...Object.values(out.names), ...Object.values(out.arts), ...Object.values(out.knipex)].map(x => x.file))].sort();
  for (const [i, f] of files.entries()) { const x = (i % 6) * 250, y = Math.floor(i / 6) * 200;
    cells.push({ input: await sharp(path.join(DIR, f)).resize(230, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: x + 10, top: y + 10 });
    cells.push({ input: Buffer.from(`<svg width="240" height="20"><text x="2" y="14" font-family="Arial" font-size="12" fill="#bbb">${f}</text></svg>`), left: x + 5, top: y + 170 }); }
  await sharp({ create: { width: 1500, height: Math.ceil(files.length / 6) * 200, channels: 3, background: '#1b1918' } }).composite(cells).jpeg({ quality: 85 }).toFile(SHEET);
  console.log('names', Object.keys(out.names).length, 'arts', Object.keys(out.arts).length, 'knipex', Object.keys(out.knipex).length, 'files', files.length, '| not named', miss.length); for (const m of miss) console.log('  ', m); })();
