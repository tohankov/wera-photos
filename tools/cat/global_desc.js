// Global check, deep pass (owner 24.10.2026, item в): the CONTENT of every visible description against WERA, and typography. Read-only.
//   node cat/global_desc.js <group live.json> <out prefix> [grn.json]  -> <out>.json + <out>.xlsx (only findings)
// Prose = the description without the variant table, its notes, the set block, the PDF block (they are checked elsewhere).
//  1. numbers with units (мм, Н·м, В, °C, кг, г) and profile sizes (PH 2, TX 20, SL 1,0×5,5 …) of the prose — must be in the WERA datasheet (all pages)
//     or the wera.de table row of the article; a number found in neither -> finding with the sentence
//  2. features named in the prose (магніт, ESD, нержавіюча сталь, фіксуюча функція, кулькова головка, Lasertip, Black Point, VDE, ударний, Rapidaptor)
//     must be named by WERA (datasheet all pages or wera.de «Produktmerkmale»); else -> finding
//  3. typography (prose AND tables): Cyrillic «х» between digits / sizes, double spaces, space before , . ; :, «( » / « )», «(SL,PH)», «x» latin in sizes
//  4. language: UA with ы э ъ ё, RU with і ї є ґ (outside brand words)
//  5. [grn.json] GRN description of the same article (owner: only to see whether everything agrees): its numbers / features that WERA states and our text does not,
//     and ours that GRN contradicts — always resolved by WERA, nothing from GRN goes to the site
const fs = require('fs'), path = require('path'); const X = require('xlsx'); const ds = require('../names/ds.js');
const [, , liveFile, out, grnFile] = process.argv; const L = JSON.parse(fs.readFileSync(liveFile, 'utf8')).filter(p => +p.display_in_showcase === 1);
const W = require('../../inventory/wera/pages.json'); const G = grnFile && fs.existsSync(grnFile) ? JSON.parse(fs.readFileSync(grnFile, 'utf8')) : {};
const dsAll = a => { try { return fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8').replace(/^p\d+ /gm, ''); } catch { return ''; } };
const dec = s => String(s).replace(/&nbsp;|&#160;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;|&rsquo;/g, '’');
const prose = h => dec(String(h || '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<div class="wsb"[\s\S]*$/, '').replace(/<h3>(?:Інші варіанти|Другие варианты)[\s\S]*?(?=<h3>|$)/g, '')
  .replace(/<h3>(?:Дізнайтеся більше|Узнайте больше)[\s\S]*$/, '').replace(/<(?:p|br|li|h\d|div)[^>]*>/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
// typography works on the raw text nodes (no normalisation): the prose part and the tables part of the description
const nodes = h => [...String(h || '').replace(/<style[\s\S]*?<\/style>/g, '').matchAll(/>([^<]+)</g)].map(m => dec(m[1])).filter(x => x.trim()).join('\n');
const tables = h => nodes((String(h || '').match(/<table[\s\S]*?<\/table>/g) || []).join(''));
const proseRaw = h => nodes(String(h || '').replace(/<table[\s\S]*?<\/table>/g, '').replace(/<div class="wsb"[\s\S]*$/, ''));
const nz = s => String(s).replace(/(\d)\.(\d)/g, '$1,$2').replace(/(,\d*?)0+\b/g, '$1').replace(/,(?!\d)/g, '');
const sentence = (t, i) => { const a = Math.max(t.lastIndexOf('.', i - 1), t.lastIndexOf('\n', i - 1)) + 1; const b = [t.indexOf('.', i), t.indexOf('\n', i)].filter(x => x >= 0); return t.slice(a, b.length ? Math.min(...b) + 1 : t.length).trim().slice(0, 220); };
// feature words: [our UA/RU regex, WERA regex (datasheet RU / wera.de DE), label]
const FEAT = [[/магніт|магнит/i, /магнит|Magnet/i, 'магніт'], [/\bESD\b|електростатич|электростатич/i, /ESD|электростатич/i, 'ESD'], [/нержав/i, /нержав|Rostfrei|Edelstahl/i, 'нержавіюча сталь'],
  [/фіксуюч|фиксирующ|\bHF\b/i, /фиксирующ|Haltefunktion|\bHF\b/i, 'фіксуюча функція'], [/кульков|шаров/i, /шаров|Kugelkopf/i, 'кулькова головка'], [/Lasertip/i, /Lasertip/i, 'Lasertip'],
  [/Black Point/i, /Black Point/i, 'Black Point'], [/\bVDE\b|ізольован|изолирован/i, /VDE|изолирован/i, 'VDE / ізоляція'], [/ударн(?!о-поворот)/i, /ударн|Schlagkappe|Schlag/i, 'ударний'], [/Rapidaptor/i, /Rapidaptor/i, 'Rapidaptor'],
  [/Take it easy/i, /Take it easy/i, 'Take it easy'], [/Hex-Plus/i, /Hex-Plus/i, 'Hex-Plus']];
const UNIT = /(\d+(?:[.,]\d+)?(?:\s?[-–]\s?\d+(?:[.,]\d+)?)?)\s?(мм|mm|Н·м|Нм|Nm|В\b|V\b|°C|кг|г\b|см)/g;
const PSZ = /\b(PH|PZ|TX|IP|SL|HEX)\s?(\d+(?:[.,]\d+)?(?:×\d+(?:[.,]\d+)?)?)/g;
const res = { nums: [], feat: [], typo: [], lang: [], grn: [] };
const add = (k, p, o) => res[k].push({ art: p.article, name: p.mod_title.ua, link: p.link, ...o });
for (const p of L) { const a = p.article; if (!/^\d{11}$/.test(a)) continue; const D = dsAll(a); const url = W.art[a]; const wp = url ? W.pages[url] : null;
  const wtxt = wp ? [wp.h1, ...(wp.merkmale || []), JSON.stringify(wp.table || {}), JSON.stringify(wp.setItems || []), ...Object.values(wp.notesText || {})].join(' ') : '';
  const src = nz(D + ' ' + wtxt + ' ' + (ds(a) || {}).title); const srcNums = new Set((src.match(/\d+(?:,\d+)?/g) || []).map(nz));
  for (const l of ['ua', 'ru']) { const t = prose(p.description[l]); if (!t) { add('nums', p, { lang: l, what: 'пустое описание', text: '' }); continue; }
    if (l === 'ua') { // numbers and features once (the RU text is the same content; its typography / language are checked below)
      for (const m of t.matchAll(UNIT)) { const nums = m[1].split(/[-–]/).map(x => nz(x.trim())); const miss = nums.filter(x => !srcNums.has(x)); if (miss.length) add('nums', p, { lang: l, what: `число «${m[0]}» нет в паспорте / wera.de`, text: sentence(t, m.index) }); }
      for (const m of t.matchAll(PSZ)) { const v = nz(m[2]).split('×'); if (v.some(x => !srcNums.has(x))) add('nums', p, { lang: l, what: `размер «${m[0]}» нет в паспорте / wera.de`, text: sentence(t, m.index) }); }
      for (const [re, wre, lab] of FEAT) { const m = t.match(re); if (m && !wre.test(D) && !wre.test(wtxt) && !wre.test((ds(a) || {}).title || '')) add('feat', p, { lang: l, what: `«${lab}» в тексте, WERA не называет`, text: sentence(t, m.index) }); } }
    // typography — prose and tables
    for (const [part, txt] of [['текст', proseRaw(p.description[l])], ['таблица', tables(p.description[l])]]) { if (!txt) continue;
      const T = [[/\d\s?х\s?\d|[A-Za-z]\s?х\s?\d|\dх[A-Za-z]/g, 'кириллическая «х» в размере'], [/\d\s?x\s?\d/g, 'латинская «x» в размере (у нас «×»)'], [/ {2,}/g, 'двойной пробел'], [/ [,.;:](?!\d)/g, 'пробел перед знаком'],
        [/\( | \)/g, 'пробел у скобки'], [/\((?:SL|PH|PZ|TX|HEX|IP)[^)]*,(?=\S)[^)]*\)/g, 'нет пробела после запятой в скобках']];
      for (const [re, what] of T) { const ms = [...txt.matchAll(re)]; if (ms.length) add('typo', p, { lang: l, part, what, n: ms.length, text: ms.slice(0, 3).map(m => '…' + txt.slice(Math.max(0, m.index - 25), m.index + 25).replace(/\s+/g, ' ') + '…').join(' | ') }); } }
    const bad = l === 'ua' ? t.match(/[ыэъё]/i) : t.replace(/Kraftform|Wera|WERA/g, '').match(/[іїєґ]/i); if (bad) add('lang', p, { lang: l, what: `буква «${bad[0]}» не той мовы`, text: sentence(t, bad.index) }); }
  // GRN — only a comparison; resolved by WERA
  const g = G[a]; if (g && g.text) { const our = nz(prose(p.description.ru) + ' ' + prose(p.description.ua)); const ourNums = new Set((our.match(/\d+(?:,\d+)?/g) || []).map(nz)); const gt = nz(g.text);
    for (const m of gt.matchAll(UNIT)) { const nums = m[1].split(/[-–]/).map(x => nz(x.trim())); if (nums.every(x => !ourNums.has(x))) add('grn', p, { what: `у GRN «${m[0]}», у нас нет`, wera: nums.every(x => srcNums.has(x)) ? 'WERA подтверждает — проверить, нужно ли в нашем тексте' : 'WERA НЕ называет — не берём', text: sentence(gt, m.index) }); }
    for (const [re, wre, lab] of FEAT) { const gm = gt.match(re), om = our.match(re); if (gm && !om) add('grn', p, { what: `у GRN «${lab}», у нас нет`, wera: wre.test(D) || wre.test(wtxt) ? 'WERA называет — проверить' : 'WERA не называет — не берём', text: sentence(gt, gm.index) }); } } }
fs.writeFileSync(out + '.json', JSON.stringify({ at: new Date().toISOString(), visible: L.length, grn: Object.keys(G).length, ...res }, null, 1));
const wb = X.utils.book_new(); const NAMES = { nums: 'Числа и размеры', feat: 'Особенности в тексте', typo: 'Типографика', lang: 'Язык', grn: 'Сверка с GRN' };
for (const k of Object.keys(res)) X.utils.book_append_sheet(wb, X.utils.json_to_sheet(res[k].length ? res[k] : [{ art: 'нет' }]), NAMES[k]);
X.writeFile(wb, out + '.xlsx'); console.log('visible', L.length, Object.entries(res).map(([k, v]) => `${k} ${v.length} (товаров ${new Set(v.map(x => x.art)).size})`).join(' | '));
