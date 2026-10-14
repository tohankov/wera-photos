// Read-only: form dryRun with the planned slug/SEO/guarantee for every product of a batch; empty willChange = already in place.
//   node lib/form_check.js batches/<name>
const fs = require('fs'), path = require('path'); const V = require('./vt.js'); const S = require('./session.js').open();
const D = path.resolve(process.argv[2]); const content = require(path.join(D, 'content.js')); const ids = JSON.parse(fs.readFileSync(path.join(D, 'ids.json'), 'utf8'));
const firstSentences = (s, max) => { const parts = s.match(/[^.!?]+[.!?]+/g) || [s]; let out = ''; for (const p of parts) { if ((out + p).trim().length > max) break; out += p; } return (out || parts[0].slice(0, max)).trim(); };
(async () => {
  const pending = [];
  for (const [a, id] of Object.entries(ids)) { const c = content[a], core = l => c.title[l].replace(` WERA ${a}`, '');
    const set = { 'modifications[0][alias][slug]': V.slugOf(c.title.ua), 'parent_common[i18n][3][seo_title]': `${core('ua')} — WERA ${a}`, 'parent_common[i18n][1][seo_title]': `${core('ru')} — WERA ${a}`, 'parent_common[guarantee_shop]': '2', 'parent_common[guarantee_length]': '12', 'parent_common[i18n][3][seo_description]': firstSentences((c.seo || c.intro).ua, 160), 'parent_common[i18n][1][seo_description]': firstSentences((c.seo || c.intro).ru, 160) };
    const r = await S.call('horoshop_admin_record_save', { entity: 'products', id: +id, dryRun: true, set }); const f = (r.willChange || []).map(w => w.field); if (f.length) pending.push(a + ' ' + f.join(',')); }
  console.log('products', Object.keys(ids).length, 'form fields still to change:', pending.length ? pending : 'none');
  S.close(); process.exit(pending.length ? 2 : 0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
