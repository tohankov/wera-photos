// Global check (docs/global_plan.md): fresh export of ONE group's articles with every field the analysis needs. Chunks of 100, 1.5 s apart,
// resumable (chunks already in <out>.parts.json are not asked again); on 429 waits the asked seconds.
//   node cat/global_export.js <groupId> <out.json>     group of an article — inventory/global_progress.json (by the MAIN section)
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open();
const [, , gid, out] = process.argv; const P = require(path.join(__dirname, '../../inventory/global_progress.json'));
const arts = Object.entries(P.articles).filter(([, v]) => String(v.group) === String(gid)).map(([a]) => a);
const F = ['article', 'parent_article', 'title', 'mod_title', 'slug', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link',
  'description', 'short_description', 'seo_title', 'seo_description', 'characteristics', 'icons', 'brand'];
const PART = out + '.parts.json'; const parts = fs.existsSync(PART) ? JSON.parse(fs.readFileSync(PART, 'utf8')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { for (let i = 0; i < arts.length; i += 100) { if (parts[i]) continue; await sleep(1500);
    const r = await S.call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: F, limit: 200, allowLarge: true });
    if (!r.response) { const m = JSON.stringify(r).match(/[Rr]etry after (\d+)/); if (m) { console.log('429, waiting', m[1]); await sleep((+m[1] + 5) * 1000); i -= 100; continue; } console.log('STOP', JSON.stringify(r).slice(0, 300)); break; }
    parts[i] = r.response.products; fs.writeFileSync(PART, JSON.stringify(parts)); console.log('chunk', i, r.response.products.length); }
  const all = Object.values(parts).flat(); const miss = arts.filter(a => !all.some(p => p.article === a));
  if (!miss.length) { fs.writeFileSync(out, JSON.stringify(all)); console.log('group', gid, 'articles', arts.length, 'exported', all.length, '->', out); } else console.log('missing', miss.length, miss.slice(0, 10).join(','));
  S.close(); })();
