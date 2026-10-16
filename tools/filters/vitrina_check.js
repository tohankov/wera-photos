// Storefront check of the bits filters (read-only, 1.5 s between requests). node filters/vitrina_check.js
const fs = require('fs'), path = require('path'); const get = require('../vt/fetchpage.js');
const SITE = 'https://tl-shop.com.ua'; const U = require('./sec_urls.json'); const { items } = require('./bits_final.json');
const live = Object.fromEntries(require('./bits_live.json').map(p => [p.article, p]));
const NONBITS = ['TL64', '05049002001', '05051278001']; const sleep = ms => new Promise(r => setTimeout(r, ms));
const CH = { 6590: 'profil', 6591: 'rozmir', 6592: 'dovzhyna', 6593: 'typ_bity', 6594: 'khvostovyk', 6595: 'osoblyvosti' };
const RU = { 'Профіль': 'Профиль', 'Розмір': 'Размер', 'Довжина': 'Длина', 'Тип біти': 'Тип биты', 'Хвостовик': 'Хвостовик', 'Особливості': 'Особенности' };
async function page(url) { await sleep(1500); for (let k = 0; k < 3; k++) { const r = await get(url); if (r.status === 200) return r.html; await sleep(5000 * (k + 1)); } return null; }
function parse(h) {
  const count = +((h.match(/товар\S*:\s*(\d+)/) || h.match(/(\d+)\s*товар/) || [])[1] || NaN);
  const pos = [...h.matchAll(/data-filter-id="(\d+)"/g)].map(m => [m.index, m[1]]);
  const sections = pos.map(([i, id], k) => [id, h.slice(i, k + 1 < pos.length ? pos[k + 1][0] : h.indexOf('</form>', i) > 0 ? i + 20000 : i + 20000)]).map(m => {
    const body = m[1]; m = [null, m[0], body]; const title = ((body.match(/<\/svg>\s*([^<]+?)\s*<\/button>/) || body.match(/filter-section-h">\s*([^<]+?)\s*</) || [])[1] || '').trim();
    const exp = (body.match(/aria-expanded="(\w+)"/) || [])[1];
    const values = [...body.matchAll(/<li class="filter-lv1-i[\s\S]*?<\/li>/g)].map(li => li[0]).map(li => ({ href: (li.match(/href="([^"]+)"/) || [])[1], title: ((li.match(/filter-title[^>]*>([^<]+)</) || [])[1] || '').trim(), n: +((li.match(/filter-count">(\d+)</) || [])[1] || 0) })).filter(v => v.title);
    return { id: m[1], title, expanded: exp, values };
  }).filter(s => s.title);
  return { count, sections };
}
const has = (h, a) => h.includes(live[a] ? live[a].link.replace(SITE, '') : a) || h.includes(a);
(async () => {
  const rep = { sections: {}, problems: [], ru: {}, narrowing: [], nonbits: [], charLinks: [] };
  const bySec = {}; for (const v of items) for (const s of v.secs) (bySec[s] = bySec[s] || []).push(v);
  for (const [id, { slug }] of Object.entries(U)) {
    if (id === '1062') continue;
    const h = await page(`${SITE}/${slug}/`); if (!h) { rep.problems.push(`${id}: page not 200`); continue; }
    const p = parse(h); const vis = (bySec[id] || []).filter(v => live[v.a].display_in_showcase === 1);
    rep.sections[id] = { count: p.count, order: p.sections.map(s => s.title), collapsedGroups: p.sections.filter(s => s.expanded === 'false').map(s => s.title) };
    for (const s of p.sections.filter(s => CH[s.id])) {
      const k = CH[s.id], sum = s.values.reduce((a, v) => a + v.n, 0);
      const want = new Set((bySec[id] || []).flatMap(v => k === 'profil' ? [v.profile[0]] : k === 'rozmir' ? [v.size] : k === 'dovzhyna' ? [v.length] : k === 'typ_bity' ? [v.type[0]] : k === 'khvostovyk' ? [v.shank[0]] : v.features.map(f => f[0])));
      const foreign = s.values.filter(v => !want.has(v.title)).map(v => v.title);
      if (foreign.length && id !== '1459') rep.problems.push(`${id} ${s.title}: значения не этого раздела: ${foreign.join(', ')}`);
      if (k !== 'osoblyvosti' && id !== '1459' && sum !== p.count) rep.problems.push(`${id} ${s.title}: сумма ${sum} ≠ товаров ${p.count}`);
      if (k === 'osoblyvosti' && sum > p.count) rep.problems.push(`${id} ${s.title}: сумма ${sum} > товаров ${p.count}`);
      rep.sections[id][s.title] = s.values.length + ' знач., сумма ' + sum;
    }
    // RU
    const hr = await page(`${SITE}/ru/${slug}/`); if (hr) { const pr = parse(hr); const bad = pr.sections.filter(s => CH[s.id] && RU[s.title]).map(s => s.title); const ua = pr.sections.filter(s => CH[s.id]).flatMap(s => s.values).filter(v => /[іїєґ]/i.test(v.title)).map(v => v.title);
      rep.ru[id] = { headings: pr.sections.map(s => s.title), untranslatedHeadings: bad, uaValues: [...new Set(ua)] }; if (bad.length || ua.length) rep.problems.push(`${id} RU: заголовки ${bad.join(',') || '—'}; укр. значения ${[...new Set(ua)].join(', ') || '—'}`); }
    // 1459: every filter value keeps the 3 accessories
    if (id === '1459') for (const s of p.sections.filter(s => CH[s.id])) for (const v of s.values) { const f = await page(SITE + v.href); const miss = NONBITS.filter(a => !has(f || '', a)); rep.nonbits.push(`${s.title}=${v.title}: ${miss.length ? 'НЕТ ' + miss.join(',') : 'все 3 на месте'}`); if (miss.length) rep.problems.push(`1459 ${s.title}=${v.title}: пропали ${miss.join(',')}`); }
  }
  // narrowing: Розмір -> Довжина in Phillips (PH 2) and TORX (TX 20)
  for (const [id, size] of [['1079', '2'], ['1069', '20']]) {
    const h = await page(`${SITE}/${U[id].slug}/`); const p = parse(h); const rs = p.sections.find(s => CH[s.id] === 'rozmir'); const v = rs && rs.values.find(x => x.title === size); if (!v) { rep.problems.push(`${id}: нет значения размера ${size}`); continue; }
    const f = parse(await page(SITE + v.href)); const dl = f.sections.find(s => CH[s.id] === 'dovzhyna'); const want = [...new Set(items.filter(x => x.secs.includes(+id) && x.size === size && live[x.a].display_in_showcase === 1).map(x => x.length))].sort();
    const got = (dl ? dl.values.map(x => x.title) : []).sort(); rep.narrowing.push(`${id} Розмір=${size}: товаров ${f.count}; Довжина на витрине [${got.join(', ')}], по данным [${want.join(', ')}] → ${JSON.stringify(got) === JSON.stringify(want) ? 'совпадает' : 'НЕ совпадает'}`);
    if (JSON.stringify(got) !== JSON.stringify(want)) rep.problems.push(`${id} сужение Розмір=${size} → Довжина не совпадает`);
  }
  // links from product characteristics
  for (const a of ['05134740001', '05056424001', '05058121001']) { const h = await page(live[a].link); const i = h.indexOf('product-features'); const blk = h.slice(i, h.indexOf('</table>', i));
    const links = [...blk.matchAll(/<a[^>]+href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(m => [m[1], m[2]]);
    for (const [href, t] of links) { const f = await page(href.startsWith('http') ? href : SITE + href); const ok = f && has(f, a); rep.charLinks.push(`${a} «${t}» → ${href} → ${ok ? 'товар в выдаче' : 'ТОВАРА НЕТ'}`); if (!ok) rep.problems.push(`ссылка характеристики ${a} ${t} ведёт не туда`); } }
  fs.writeFileSync(path.join(__dirname, 'vitrina_report.json'), JSON.stringify(rep, null, 1));
  console.log(JSON.stringify(rep, null, 1).slice(0, 9000));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
