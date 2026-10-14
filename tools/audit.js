// READ-ONLY audit of the work of 13-14.10.2026 against a FRESH live export of the site. Writes nothing to the site.
// Independent of lib/run_batch.js / lib/build.js: own parsing, own rules. Sources: live export + admin read (SEO/guarantee),
// grn_wera.csv, wera_price.xlsx, downloaded datasheets (batch/ds), backups. HTTP: HEAD/GET of our own pages, images, and the PDF links.
//   node audit.js            -> inventory/audit_15-10.xlsx + audit_cache/summary.json
const fs = require('fs'), path = require('path'), X = require('xlsx');
const ROOT = 'C:/Users/Techlight/Desktop/wera-photos/', BK = ROOT + 'backup/', INV = ROOT + 'inventory/', T = __dirname;
const CACHE = path.join(T, 'audit_cache'); fs.mkdirSync(CACHE, { recursive: true });
const SITE = 'https://tl-shop.com.ua';
const S = require('./lib/session.js').open();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const prods = j => (j.response ? j.response.products : j.products || j);

// ---------- HTTP (status without following redirects; cached per run) ----------
const REUSE = process.argv.includes('--reuse'); // continue a run cut by the 10-min limit: reuse live export, SEO reads and HTTP results
const HF = path.join(CACHE, 'http.json'); const httpDone = REUSE && fs.existsSync(HF) ? J(HF) : {}; let httpN = 0;
const saveHttp = () => fs.writeFileSync(HF, JSON.stringify(httpDone));
const httpCache = {};
// one request at a time per host with a gap; 429/5xx are retried with back-off and never cached (first run hit 429 on our site)
const gate = {}; const GAP = { site: 350, pdf: 120 };
const slot = host => { const prev = gate[host] || Promise.resolve(); let done; const p = new Promise(r => (done = r)); gate[host] = prev.then(() => p); return prev.then(() => () => setTimeout(done, GAP[host] || 200)); };
async function status(url, host) {
  if (httpDone[url]) return httpDone[url];
  if (httpCache[url]) return httpCache[url];
  const p = (async () => {
    for (let k = 0; k < 5; k++) {
      try {
        const release = await slot(host); let r;
        try { r = await fetch(url, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36' } });
          if (r.status === 405 || r.status === 403 && host !== 'site') r = await fetch(url, { method: 'GET', redirect: 'manual', headers: { range: 'bytes=0-0', 'user-agent': 'Mozilla/5.0 Chrome/140' } }); } finally { release(); }
        if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 4000 * (k + 1) * (k + 1))); continue; }
        return { s: r.status, loc: r.headers.get('location') || '' };
      } catch (e) { await new Promise(r => setTimeout(r, 1500)); }
    }
    return { s: 0, loc: 'no answer after retries (429/5xx/network)' };
  })().then(r => { if (r.s) httpDone[url] = r; if (++httpN % 200 === 0) saveHttp(); return r; });
  httpCache[url] = p; return p;
}
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }

// ---------- independent parsers ----------
const tableBlock = html => { const i = html.search(/<h3>(Інші варіанти серії|Другие варианты серии)/); if (i < 0) return null; const j = html.indexOf('</table>', i); if (j < 0) return null; const k = html.indexOf('</p>', j); return { start: i, end: k < 0 ? j + 8 : k + 4, html: html.slice(i, k < 0 ? j + 8 : k + 4) }; };
const outsideTable = html => { const b = tableBlock(html); return (b ? html.slice(0, b.start) + html.slice(b.end) : html).replace(/\s+/g, ' ').trim(); };
const rows = block => [...block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => m[1]).filter(r => /<td/.test(r)).map(r => { const first = (r.match(/<td[^>]*>([\s\S]*?)<\/td>/) || [])[1] || ''; return { href: (first.match(/href="([^"]+)"/) || [])[1] || null, art: (first.replace(/<[^>]+>/g, ' ').match(/\b(?:0\d{10}|TL\d+)\b/) || [])[0] || null, cur: /цей товар|этот товар/.test(first) }; });
const pdfLinks = html => [...html.matchAll(/href="([^"]+\.pdf)"/gi)].map(m => m[1]);
const slugOfLink = l => (l || '').replace(SITE, '').replace(/^\/ru\//, '/').replace(/^\/|\/$/g, '');
const halfUp = x => Math.floor(x + 0.5);

(async () => {
  // ---------- 0. inputs ----------
  log('reading inputs');
  const grn = {}; for (const l of fs.readFileSync(INV + 'grn_wera.csv', 'utf8').split(/\r?\n/).slice(1)) { const c = l.replace(/"/g, '').split(';'); if (c[0]) grn[c[0]] = { price: c[1] ? +c[1] : null, stock: c[2] }; }
  const rrp = {}; { const ws = X.readFile(INV + 'wera_price.xlsx').Sheets['WERA 2026 GRN']; const r = X.utils.decode_range(ws['!ref']); for (let y = r.s.r; y <= r.e.r; y++) { const a = ws[X.utils.encode_cell({ r: y, c: 2 })], v = ws[X.utils.encode_cell({ r: y, c: 4 })]; if (a && /^\d{11}$/.test(String(a.v).trim()) && v && typeof v.v === 'number') rrp[String(a.v).trim()] = v.v; } }
  const expectedPrice = a => { const g = grn[a]?.price ?? null, r = rrp[a] ?? null; if (g == null && r == null) return null; if (g == null) return { p: halfUp(r), why: 'нет у GRN → РРЦ' }; if (r == null) return { p: g, why: 'нет в прайсе → GRN' }; return r - g >= 1 ? { p: halfUp(r), why: `GRN ${g} ниже РРЦ ${r} → РРЦ` } : { p: g, why: `GRN ${g} (РРЦ ${r})` }; };
  // the 405 new products: created_today.xlsx + every batch's links.json; plan = the batch's import payload
  const ct = X.utils.sheet_to_json(X.readFile(INV + 'created_today.xlsx').Sheets['Создано'], { header: 1 }).slice(1).filter(r => r[1]).map(r => ({ batch: r[0], a: String(r[1]), group: r[2] }));
  const plan = {}, batchOf = {}, oldLinks = {};
  for (const b of fs.readdirSync(path.join(T, 'batches'))) {
    const d = path.join(T, 'batches', b); if (!fs.statSync(d).isDirectory()) continue;
    if (fs.existsSync(path.join(d, 'links.json'))) for (const a of Object.keys(J(path.join(d, 'links.json')))) batchOf[a] = b;
    if (fs.existsSync(path.join(d, 'payload_new.json'))) for (const p of prods(J(path.join(d, 'payload_new.json')))) plan[p.article] = { parent: p.parent && p.parent.id, alt: (p.alt_parent || []).map(x => x.id).sort(), batch: b };
  }
  // links the products had right after import, before the slug was set (Horoshop must redirect them)
  for (const f of fs.readdirSync(BK).filter(f => /_new_before_form\.json$|^pilot_867_4z_before_slug\.json$|^c2_before_resume\.json$/.test(f))) for (const p of prods(J(BK + f))) if (p && p.link) (oldLinks[p.article] = oldLinks[p.article] || new Set()).add(p.link);
  const newArts = [...new Set([...ct.map(x => x.a), ...Object.keys(batchOf)])];
  const ctSet = new Set(ct.map(x => x.a));
  const group = Object.fromEntries(J(path.join(T, 'a422/classified.json')).map(x => [x.article, x.group]));
  log('new products', newArts.length, '| created_today', ctSet.size, '| batches', Object.keys(batchOf).length);

  // ---------- live export: whole catalog ----------
  const LF = path.join(CACHE, 'live.json'); const live = REUSE && fs.existsSync(LF) ? J(LF) : [];
  if (!live.length) for (let off = 0; ; off += 100) {
    const r = await S.call('horoshop_catalog_export', { includedParams: ['article', 'parent_article', 'title', 'price', 'parent', 'alt_parent', 'display_in_showcase', 'images', 'link', 'description', 'presence'], limit: 100, offset: off, allowLarge: true });
    const p = r.response.products; live.push(...p); if (p.length < 100) break;
  }
  fs.writeFileSync(path.join(CACHE, 'live.json'), JSON.stringify(live)); log('live export', live.length);
  const L = {}; for (const p of live) if (!L[p.article]) L[p.article] = p;
  const bySlug = {}; for (const p of live) bySlug[slugOfLink(p.link)] = p.article;

  const P = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, N = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const bad = (k, a, link, check, what, fix) => P[k].push([a, link || '', check, what, fix]);

  // ---------- 1. the new products ----------
  log('1: SEO/guarantee via admin read');
  const ids = {}; for (const b of fs.readdirSync(path.join(T, 'batches'))) { const f = path.join(T, 'batches', b, 'ids.json'); if (fs.existsSync(f)) Object.assign(ids, J(f)); }
  const SF = path.join(CACHE, 'seo.json'); const seo = REUSE && fs.existsSync(SF) ? J(SF) : {}; let seoN = 0;
  for (const a of newArts) {
    if (seo[a]) continue; if (++seoN % 20 === 0) fs.writeFileSync(SF, JSON.stringify(seo));
    let id = ids[a];
    if (!id) { const r = await S.call('horoshop_admin_list', { entity: 'products', search: a }); const rec = (r.records || []).filter(x => (x.cells && x.cells[0] === a) || x.label.split(' ').includes(a)); if (rec.length === 1) id = rec[0].id; }
    if (!id) { seo[a] = null; continue; }
    const r = await S.call('horoshop_admin_record_get', { entity: 'products', id: +id, fields: ['seo_title', 'seo_description', 'guarantee', 'alias][slug', '[article]'] });
    seo[a] = r.fields || null;
  }
  fs.writeFileSync(path.join(CACHE, 'seo.json'), JSON.stringify(seo));
  log('1: checks');
  const tableHrefs = new Set(), images = new Set(), pdfs = new Set();
  for (const a of newArts) {
    N[1]++; const p = L[a]; const link = p ? p.link : '';
    if (!p) { bad(1, a, '', 'наличие', 'товара нет в выгрузке сайта', 'проверить, не удалён ли'); continue; }
    if (!ctSet.has(a)) bad(1, a, link, 'учёт', 'нет в created_today.xlsx', 'обновить created_today.xlsx');
    if (!batchOf[a]) bad(1, a, link, 'учёт', 'нет ни в одной партии (links.json)', 'выяснить происхождение');
    // price
    const e = expectedPrice(a); if (e && p.price !== e.p) bad(1, a, link, 'цена', `на сайте ${p.price}, по правилу ${e.p} (${e.why})`, 'исправить цену импортом');
    if (!e) bad(1, a, link, 'цена', `нет ни GRN, ни РРЦ; на сайте ${p.price}`, 'решить цену');
    // title
    for (const l of ['ua', 'ru']) {
      const t = p.title[l] || ''; const w = [];
      if (!t.endsWith(` WERA ${a}`)) w.push('не заканчивается на «WERA <артикул>»');
      if ((t.match(new RegExp(a, 'g')) || []).length !== 1) w.push('артикул в названии не один раз');
      if (/\d\s*х\s*\d|\dх|х\d/.test(t)) w.push('кириллическая «х» в размере');
      if (/\d\s*x\s*\d/.test(t)) w.push('латинская «x» вместо «×»');
      if (/\d\.\d/.test(t.replace(` WERA ${a}`, ''))) w.push('десятичная точка вместо запятой');
      if (/\b(PH|PZ|TX|HEX|IP)\d/.test(t)) w.push('нет пробела после PH/PZ/TX/HEX/IP');
      if (/\b(\S{2,})\s+\1\b/i.test(t) || /IP \d+ IP/.test(t)) w.push('дубль слова');
      if (/\s{2,}/.test(t)) w.push('двойной пробел');
      if (l === 'ua' && /[ыэъё]/i.test(t)) w.push('русские буквы в UA');
      if (l === 'ru' && /[іїєґ]/i.test(t)) w.push('украинские буквы в RU');
      if (w.length) bad(1, a, link, 'название ' + l.toUpperCase(), `«${t}»: ${w.join('; ')}`, 'поправить название');
    }
    // article: card = title = datasheet
    const dsf = path.join(T, 'batch/ds', a + '.txt');
    if (!fs.existsSync(dsf)) bad(1, a, link, 'артикул/даташит', 'нет скачанного даташита', 'скачать даташит и сверить');
    else { const m = fs.readFileSync(dsf, 'utf8').match(/№ детали: \| (\d{11})/); if (!m || m[1] !== a) bad(1, a, link, 'артикул/даташит', `в даташите № детали ${m ? m[1] : '—'}`, 'сверить артикул'); }
    if (p.article !== a) bad(1, a, link, 'артикул', `в карточке ${p.article}`, 'сверить артикул');
    // section
    const pl = plan[a]; const altLive = (p.alt_parent || []).map(x => x.id).sort();
    if (!pl) bad(1, a, link, 'раздел', 'нет плана (payload партии)', 'сверить вручную');
    else { if (p.parent.id !== pl.parent) bad(1, a, link, 'раздел', `основной ${p.parent.id}, по плану ${pl.parent}`, 'вернуть раздел импортом'); if (altLive.join() !== pl.alt.join()) bad(1, a, link, 'alt_parent', `на сайте [${altLive}], по плану [${pl.alt}]`, 'восстановить alt_parent импортом'); }
    if (p.display_in_showcase !== 1) bad(1, a, link, 'отображение', 'скрыт', 'включить отображение');
    // photo
    const im = p.images || []; if (!im.length) bad(1, a, link, 'фото', 'нет фото', 'загрузить фото');
    for (const u of im) { if (!u.startsWith(SITE + '/content/')) bad(1, a, link, 'фото', `не на нашем CDN: ${u}`, 'перезалить на CDN'); images.add(u); }
    // description
    for (const l of ['ua', 'ru']) {
      const d = (p.description && p.description[l]) || ''; const txt = d.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (txt.length < 80) bad(1, a, link, 'описание ' + l.toUpperCase(), `пустое или слишком короткое (${txt.length} симв.)`, 'заполнить описание');
      if (/grn/i.test(d)) bad(1, a, link, 'описание ' + l.toUpperCase(), 'упоминание GRN', 'убрать');
      if (/wera\.com\.ua/i.test(d)) bad(1, a, link, 'описание ' + l.toUpperCase(), 'ссылка на wera.com.ua', 'убрать');
      const pf = pdfLinks(d); if (!pf.length) bad(1, a, link, 'PDF ' + l.toUpperCase(), 'нет ссылки «Технічний паспорт (PDF)»', 'добавить блок PDF');
      for (const u of pf) { pdfs.add(u); if (!u.includes(a)) bad(1, a, link, 'PDF ' + l.toUpperCase(), `ссылка на чужой артикул: ${u}`, 'исправить ссылку'); }
      // group A: series table
      if (group[a] === 'А') {
        const b = tableBlock(d); if (!b) { bad(1, a, link, 'таблица ' + l.toUpperCase(), 'нет таблицы серии', 'добавить таблицу'); continue; }
        const rs = rows(b.html); const me = rs.filter(r => r.cur);
        if (me.length !== 1 || me[0].art !== a) bad(1, a, link, 'таблица ' + l.toUpperCase(), `строка «цей товар»: ${me.map(r => r.art).join(',') || 'нет'}`, 'исправить строку текущего товара');
        for (const r of rs) if (r.href) tableHrefs.add(JSON.stringify([a, l, r.href, r.art]));
      }
    }
    // SEO, guarantee, slug
    const f = seo[a];
    if (!f) bad(1, a, link, 'SEO/гарантия', 'не удалось прочитать карточку в админке', 'проверить вручную');
    else {
      if (f['modifications[0][article]'] && f['modifications[0][article]'] !== a) bad(1, a, link, 'SEO/гарантия', `id из ids.json открывает ${f['modifications[0][article]']}`, 'сверить id');
      for (const [k, n] of [['3', 'UA'], ['1', 'RU']]) {
        const st = f[`parent_common[i18n][${k}][seo_title]`] || '', sd = f[`parent_common[i18n][${k}][seo_description]`] || '';
        if (!st) bad(1, a, link, 'SEO title ' + n, 'пусто', 'заполнить'); else if (!st.includes(a)) bad(1, a, link, 'SEO title ' + n, `без артикула: «${st}»`, 'поправить');
        if (!sd) bad(1, a, link, 'SEO meta ' + n, 'пусто', 'заполнить');
        else { if (sd.length > 160) bad(1, a, link, 'SEO meta ' + n, `длина ${sd.length} > 160`, 'сократить'); if (!/[.!?…»)″]$/.test(sd.trim())) bad(1, a, link, 'SEO meta ' + n, `обрезано на полуслове: «…${sd.slice(-40)}»`, 'переписать meta целыми фразами ≤160'); }
      }
      if (f['parent_common[guarantee_shop]'] !== '2' || f['parent_common[guarantee_length]'] !== '12') bad(1, a, link, 'гарантия', `shop=${f['parent_common[guarantee_shop]']}, length=${f['parent_common[guarantee_length]']}`, 'виробник / 12 міс.');
      const slug = f['modifications[0][alias][slug]'] || ''; if (slug !== slugOfLink(link)) bad(1, a, link, 'адрес', `slug в админке «${slug}» ≠ ссылка`, 'сверить');
      for (const m of (p.title.ua || '').matchAll(/(\d+(?:,\d+)?|\d+\/\d+)″?×(\d+(?:,\d+)?)/g)) { const want = `${m[1].replace(',', '-').replace('/', '-')}x${m[2].replace(',', '-')}`; if (!slug.includes(want)) bad(1, a, link, 'адрес', `в адресе нет «${want}» (размер ${m[0]})`, 'адрес через форму + 301'); }
      if (/[^a-z0-9-]/.test(slug)) bad(1, a, link, 'адрес', `недопустимые символы: ${slug}`, 'поправить');
    }
  }
  // 301 from the old auto addresses
  log('1: 301 from old addresses');
  const redirects = []; for (const a of newArts) for (const old of (oldLinks[a] || [])) if (L[a] && old !== L[a].link) for (const pre of ['', '/ru']) redirects.push([a, SITE + pre + old.replace(SITE, ''), SITE + pre + L[a].link.replace(SITE, '')]);
  await pool(redirects, 6, async ([a, from, to]) => { const r = await status(from, 'site'); if (!(r.s === 301 && (r.loc === to || SITE + r.loc === to))) bad(1, a, L[a].link, '301 со старого адреса', `${from} → ${r.s} ${r.loc}`, 'создать 301'); });
  // images, PDFs, table links
  log('1: images', images.size, 'table links', tableHrefs.size);
  await pool([...images], 6, async u => { const r = await status(u, 'site'); if (r.s !== 200) { const a = newArts.find(x => (L[x]?.images || []).includes(u)); bad(1, a, L[a]?.link, 'фото', `${u} → ${r.s}`, 'перезалить фото'); } });
  await pool([...tableHrefs].map(x => JSON.parse(x)), 6, async ([a, l, href, art]) => { const u = href.startsWith('http') ? href : SITE + href; const r = await status(u, 'site'); if (r.s !== 200) bad(1, a, L[a].link, 'таблица ' + l.toUpperCase(), `ссылка ${href} → ${r.s} ${r.loc}`, 'исправить ссылку'); const target = bySlug[slugOfLink(href)]; if (target && art && target !== art) bad(1, a, L[a].link, 'таблица ' + l.toUpperCase(), `строка ${art} ведёт на товар ${target}`, 'исправить ссылку'); });

  // ---------- 2. neighbours ----------
  log('2: neighbours');
  const nbBefore = {};
  const nbFiles = fs.readdirSync(BK).filter(f => /_neighbours_before\.json$|^pilot_867_4z_before\.json$|^slugfix_05221110001_links_before\.json$/.test(f)).map(f => [f, fs.statSync(BK + f).mtimeMs]).sort((x, y) => x[1] - y[1]);
  for (const [f] of nbFiles) for (const p of prods(J(BK + f))) if (p && p.article && p.description && !nbBefore[p.article] && !newArts.includes(p.article)) nbBefore[p.article] = { p, f };
  const nbHrefs = [];
  for (const [a, { p: b, f }] of Object.entries(nbBefore)) {
    N[2]++; const p = L[a]; if (!p) { bad(2, a, '', 'наличие', 'нет в выгрузке', 'проверить'); continue; }
    for (const l of ['ua', 'ru']) {
      const d = p.description[l] || '', blk = tableBlock(d);
      if (!blk) { bad(2, a, p.link, 'таблица ' + l.toUpperCase(), 'таблица пропала', `восстановить из ${f}`); continue; }
      if (outsideTable(d) !== outsideTable(b.description[l] || '')) bad(2, a, p.link, 'описание ' + l.toUpperCase(), 'текст вне таблицы изменился относительно бэкапа', `сравнить с ${f}`);
      const rs = rows(blk.html); const me = rs.filter(r => r.cur); if (me.length !== 1 || me[0].art !== a) bad(2, a, p.link, 'таблица ' + l.toUpperCase(), `строка «цей товар»: ${me.map(r => r.art).join(',') || 'нет'}`, 'исправить');
      for (const r of rs) if (r.href) nbHrefs.push([a, l, r.href, r.art]);
    }
  }
  await pool(nbHrefs, 6, async ([a, l, href, art]) => { const u = href.startsWith('http') ? href : SITE + href; const r = await status(u, 'site'); if (r.s !== 200) bad(2, a, L[a].link, 'ссылка ' + l.toUpperCase(), `${href} (строка ${art}) → ${r.s} ${r.loc}`, 'исправить ссылку'); const target = bySlug[slugOfLink(href)]; if (!target) bad(2, a, L[a].link, 'ссылка ' + l.toUpperCase(), `${href}: нет товара с таким адресом`, 'исправить ссылку'); else if (art && target !== art) bad(2, a, L[a].link, 'ссылка ' + l.toUpperCase(), `строка ${art} ведёт на товар ${target}`, 'исправить ссылку'); });

  // ---------- 3. the 23 prices ----------
  log('3: 23 prices');
  for (const d of prods(J(BK + 'price23_after.json'))) { N[3]++; const p = L[d.article]; if (!p) bad(3, d.article, '', 'наличие', 'нет в выгрузке', 'проверить'); else if (p.price !== d.price) bad(3, d.article, p.link, 'цена', `на сайте ${p.price}, решение ${d.price}`, 'вернуть цену решения'); }

  // ---------- 4. visibility ----------
  log('4: visibility');
  const ng = X.utils.sheet_to_json(X.readFile(INV + 'not_at_grn_check.xlsx').Sheets['89 товаров'], { header: 1 }).slice(1).filter(r => r[0]);
  const hide41 = ng.filter(r => /не найден/.test(r[3]) && r[8] === 'скрыть').map(r => String(r[0])), act27 = ng.filter(r => /^актуальный/.test(r[3])).map(r => String(r[0]));
  for (const a of hide41) { N[4]++; const p = L[a]; if (!p) bad(4, a, '', '41 скрыть', 'нет в выгрузке', 'проверить'); else if (p.display_in_showcase !== 0) bad(4, a, p.link, '41 скрыть', 'отображается', 'скрыть'); }
  for (const a of ['05681419001', 'Home Kraftform']) { N[4]++; const p = L[a]; if (!p) bad(4, a, '', 'Belt 781 / Home', 'нет в выгрузке', 'проверить'); else if (p.display_in_showcase !== 0) bad(4, a, p.link, 'Belt 781 / Home', 'отображается', 'скрыть'); }
  for (const a of act27) { N[4]++; const p = L[a]; if (!p) { bad(4, a, '', '27 актуальных', 'нет в выгрузке', 'проверить'); continue; } if (p.display_in_showcase !== 1) bad(4, a, p.link, '27 актуальных', 'скрыт', 'показать'); const r = rrp[a]; if (r == null) bad(4, a, p.link, '27 актуальных', `нет в прайсе; цена на сайте ${p.price}`, 'решить цену'); else if (p.price !== halfUp(r)) bad(4, a, p.link, '27 актуальных', `цена ${p.price}, прайс ${halfUp(r)} (${r})`, 'цена = прайс'); }

  // ---------- 5. sections 1460-1465 ----------
  log('5: sections');
  const tree = (await S.call('horoshop_pages_export', { parent: 0, allowLarge: true })).response.pages; const byId = Object.fromEntries(tree.map(x => [x.id, x]));
  for (const id of [1460, 1461, 1462, 1463, 1464, 1465]) {
    N[5]++; const pg = byId[id]; if (!pg) { bad(5, id, '', 'раздел', 'нет в дереве', 'проверить'); continue; }
    const n = live.filter(p => p.parent && p.parent.id === id || (p.alt_parent || []).some(x => x.id === id)).length;
    if (!n) bad(5, id, '', 'товары', 'раздел пустой', 'наполнить или скрыть');
    if (!pg.image) bad(5, id, '', 'обложка', 'нет обложки', 'загрузить обложку');
    const rec = await S.call('horoshop_admin_record_get', { entity: 'pages', id, parent: pg.parent, fields: ['alias', 'slug', 'link'] }); const slug = Object.entries(rec.fields || {}).find(([k, v]) => /slug|alias/.test(k) && typeof v === 'string' && v)?.[1];
    if (!slug) { bad(5, id, '', 'адрес', 'не удалось прочитать адрес раздела', 'проверить'); continue; }
    for (const pre of ['', '/ru']) { const u = `${SITE}${pre}/${slug.replace(/^\/|\/$/g, '')}/`; const r = await status(u, 'site'); if (r.s !== 200) bad(5, id, u, 'витрина', `${r.s} ${r.loc}`, 'проверить адрес'); }
    P.sec = P.sec || []; P.sec.push([id, pg.title.ua, n, !!pg.image]);
  }

  // ---------- 6. datasheet PDF over the whole catalog ----------
  log('6: PDF over catalog', live.length);
  const isWera = a => /^05\d{9}$/.test(a);
  const canon = a => `https://hybris-media.wera.de/download/pdfgenerator-datasheets/ru/${a}.pdf`;
  const seen6 = new Set(); const need = new Set();
  for (const p of live) { if (seen6.has(p.article)) continue; seen6.add(p.article); for (const l of ['ua', 'ru']) for (const u of pdfLinks(p.description?.[l] || '')) need.add(u); if (isWera(p.article)) need.add(canon(p.article)); }
  log('6: PDF URLs to check', need.size);
  await pool([...need], 4, u => status(u, 'pdf'));
  const ok = async u => (await status(u, 'pdf')).s === 200;
  seen6.clear();
  for (const p of live) {
    if (seen6.has(p.article)) continue; seen6.add(p.article); N[6]++;
    const a = p.article, ln = { ua: pdfLinks(p.description?.ua || ''), ru: pdfLinks(p.description?.ru || '') };
    const wera = isWera(a); const hasWera = wera ? await ok(canon(a)) : false;
    for (const l of ['ua', 'ru']) {
      const list = ln[l];
      if (!list.length) { bad(6, a, p.link, 'PDF ' + l.toUpperCase(), !wera ? 'нет ссылки; не WERA-артикул (внутренний код)' : hasWera ? 'нет ссылки — мы не поставили (у WERA PDF есть)' : 'нет ссылки — у WERA PDF нет (404)', !wera ? 'нет данных — оставить' : hasWera ? 'добавить блок PDF' : 'оставить без PDF'); continue; }
      for (const u of list) { const s = (await status(u, 'pdf')).s; if (s !== 200) bad(6, a, p.link, 'PDF ' + l.toUpperCase(), `битая ссылка ${u} → ${s}${hasWera ? '; правильный PDF есть' : ''}`, hasWera ? `заменить на ${canon(a)}` : 'убрать ссылку'); else if (wera && !u.includes(a)) bad(6, a, p.link, 'PDF ' + l.toUpperCase(), `ссылка не та: ${u}`, hasWera ? `заменить на ${canon(a)}` : 'проверить'); }
    }
  }
  S.close(); saveHttp();

  // ---------- output ----------
  const names = { 1: '1 Новые 405', 2: '2 Соседи', 3: '3 Цены 23', 4: '4 Видимость', 5: '5 Разделы', 6: '6 PDF каталог' };
  const wb = X.utils.book_new(); const summary = [['Проверка', 'Проверено', 'Проблемных строк', 'Товаров с проблемой']];
  for (const k of [1, 2, 3, 4, 5, 6]) { const rowsK = P[k]; summary.push([names[k], N[k], rowsK.length, new Set(rowsK.map(r => r[0])).size]); }
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(summary), 'Сводка');
  for (const k of [1, 2, 3, 4, 5, 6]) X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Ссылка', 'Проверка', 'Что не так', 'Как исправить'], ...P[k]]), names[k]);
  X.writeFile(wb, INV + 'audit_15-10.xlsx');
  const byCheck = {}; for (const k of [1, 2, 3, 4, 5, 6]) for (const r of P[k]) { const key = k + ' ' + r[2].replace(/ (UA|RU)$/, ''); byCheck[key] = (byCheck[key] || 0) + 1; }
  fs.writeFileSync(path.join(CACHE, 'summary.json'), JSON.stringify({ summary, byCheck, sections: P.sec, httpChecked: Object.keys(httpCache).length }, null, 1));
  console.log(JSON.stringify({ summary, byCheck, sections: P.sec }, null, 1));
  process.exit(0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
