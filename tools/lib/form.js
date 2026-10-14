// Slug (× -> x) + SEO title/description (UA/RU) for a batch, through the product form, with the CLAUDE.md check:
// export before, save, export after, every field except `link` must be identical (parent / alt_parent above all).
// node lib/form.js <batchDir> dry|real
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const V = require('./vt.js');
const [, , dir, mode] = process.argv; const D = path.resolve(dir), NAME = path.basename(D);
const REPO = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const ids = require(D + '/ids.json'), content = require(D + '/content.js');
const S = require('./session.js').open();
const mcp = async (tool, args, out) => { const r = await S.call(tool, args); fs.writeFileSync(out, JSON.stringify(r)); return r; };
const firstSentences = (s, max) => { const parts = s.match(/[^.!?]+[.!?]+/g) || [s]; let out = ''; for (const p of parts) { if ((out + p).trim().length > max) break; out += p; } return (out || parts[0].slice(0, max)).trim(); };
const sets = Object.entries(ids).map(([a, id]) => {
  const c = content[a], core = l => c.title[l].replace(` WERA ${a}`, '');
  return { a, id, set: {
    'modifications[0][alias][slug]': V.slugOf(c.title.ua),
    'parent_common[i18n][3][seo_title]': `${core('ua')} — WERA ${a}`, 'parent_common[i18n][1][seo_title]': `${core('ru')} — WERA ${a}`,
    'parent_common[guarantee_shop]': '2', 'parent_common[guarantee_length]': '12',
    'parent_common[i18n][3][seo_description]': firstSentences(c.intro.ua, 160), 'parent_common[i18n][1][seo_description]': firstSentences(c.intro.ru, 160) } };
});
const exportArgs = { expr: { article: Object.keys(ids) }, includedParams: ['article', 'title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'], limit: 50, allowLarge: true };
(async () => {
if (mode === 'dry') {
  for (const s of sets) {
    const r = await mcp('horoshop_admin_record_save', { entity: 'products', id: +s.id, dryRun: true, set: s.set }, D + `/form_dry_${s.a}.json`);
    console.log(s.a, 'changes', (r.willChange || []).length, 'unknown', (r.unknownFields || []).length, '| slug', s.set['modifications[0][alias][slug]'], '| seo len', s.set['parent_common[i18n][3][seo_title]'].length, s.set['parent_common[i18n][3][seo_description]'].length);
  }
  fs.writeFileSync(D + '/form_sets.json', JSON.stringify(sets, null, 1));
} else {
  const before = (await mcp('horoshop_catalog_export', exportArgs, REPO + NAME + '_new_before_form.json')).response.products;
  for (const s of sets) {
    // hard stop: never write when the dryRun reports a field outside the planned set
    const d = await mcp('horoshop_admin_record_save', { entity: 'products', id: +s.id, dryRun: true, set: s.set }, D + `/form_check_${s.a}.json`);
    const off = (d.willChange || []).map(w => w.field).filter(f => !(f in s.set)); if (off.length || (d.unknownFields || []).length) { console.log(s.a, 'SKIPPED: dryRun outside plan', off, d.unknownFields); continue; }
    const r = await mcp('horoshop_admin_record_save', { entity: 'products', id: +s.id, dryRun: false, set: s.set }, D + `/form_real_${s.a}.json`);
    console.log(s.a, 'saved', r.saved, 'persisted', (r.changes || []).filter(c => c.persisted).length + '/' + (r.changes || []).length);
  }
  const after = (await mcp('horoshop_catalog_export', exportArgs, REPO + NAME + '_new_after_form.json')).response.products;
  const bad = [];
  for (const x of before) { const y = after.find(q => q.article === x.article); for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (k !== 'link' && JSON.stringify(x[k]) !== JSON.stringify(y[k])) bad.push(x.article + ' ' + k); }
  const links = Object.fromEntries(after.map(p => [p.article, p.link.replace('https://tl-shop.com.ua', '')]));
  fs.writeFileSync(D + '/links.json', JSON.stringify(links, null, 1));
  console.log('fields changed by the form (besides link):', bad.length ? bad : 'none'); console.log(links);
}
S.close();
})();
