// Create new catalog sections with a cover (1200x1200 transparent PNG, product's long side 1008 px) and SEO, checking the tree before/after.
//   node lib/newcat.js <spec.json>   spec: [{key, parent, title:{ua,ru}, slug, seoTitle:{ua,ru}, seoDescription:{ua,ru}, seoText:{ua,ru}, cover: imageFile}]
// Writes <spec>.result.json {key: id}. Tree check: every node that existed before must be unchanged; only the new ids may appear.
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const S = require('./session.js').open(); const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const specFile = process.argv[2]; const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
async function cover(src) {
  const im = sharp(src).ensureAlpha(); const { data, info } = await im.clone().raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { const i = (y * info.width + x) * 4; if (data[i + 3] > 8 && !(data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = 1008 / Math.max(w, h);
  const prod = await sharp(src).ensureAlpha().extract({ left: x0, top: y0, width: w, height: h }).resize(Math.round(w * k), Math.round(h * k)).png().toBuffer();
  return sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: prod, left: Math.round((1200 - w * k) / 2), top: Math.round((1200 - h * k) / 2) }]).png().toBuffer();
}
const tree = async () => { const r = await S.call('horoshop_pages_export', { parent: 0, allowLarge: true }); return (r.response && (r.response.pages || r.response)) || r.pages || r; };
const flat = t => { const out = {}; const walk = x => { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === 'object') { if (x.id != null && x.title) out[x.id] = JSON.stringify({ parent: x.parent, title: x.title, discount: x.discount, image: x.image }); for (const v of Object.values(x)) if (v && typeof v === 'object') walk(v); } }; walk(t); return out; };
(async () => {
  const before = flat(await tree()); fs.writeFileSync(BK + 'tree_before_' + path.basename(specFile), JSON.stringify(before)); console.log('tree nodes before', Object.keys(before).length);
  const result = fs.existsSync(specFile + '.result.json') ? JSON.parse(fs.readFileSync(specFile + '.result.json', 'utf8')) : {};
  for (const c of spec) {
    if (result[c.key]) { console.log('exists', c.key, result[c.key]); continue; }
    const png = await cover(c.cover); fs.writeFileSync(path.join(path.dirname(specFile), c.key + '.png'), png);
    const args = { parent: c.parent, title: c.title.ua, slug: c.slug, inMenu: true, h1: c.title.ua, seoTitle: c.seoTitle.ua, seoDescription: c.seoDescription.ua, seoText: c.seoText.ua,
      ru: { title: c.title.ru, h1: c.title.ru, seoTitle: c.seoTitle.ru, seoDescription: c.seoDescription.ru, seoText: c.seoText.ru }, cover: { base64: png.toString('base64'), filename: c.key + '.png', contentType: 'image/png' } };
    const dry = await S.call('horoshop_admin_category_create', { ...args, dryRun: true });
    if (dry.slug !== c.slug) { console.log('STOP slug plan', c.key, dry.slug); continue; }
    const r = await S.call('horoshop_admin_category_create', { ...args, dryRun: false });
    console.log(c.key, 'created', r.created, 'id', r.newId, 'slug', r.slug, 'cover', r.cover && r.cover.uploaded, r.partialFailure ? 'PARTIAL ' + JSON.stringify(r.partialFailure) : '');
    if (r.newId) { result[c.key] = +r.newId; fs.writeFileSync(specFile + '.result.json', JSON.stringify(result, null, 1)); }
  }
  const after = flat(await tree()); fs.writeFileSync(BK + 'tree_after_' + path.basename(specFile), JSON.stringify(after));
  const changed = Object.keys(before).filter(id => before[id] !== after[id]); const added = Object.keys(after).filter(id => !(id in before));
  console.log('tree: changed existing', changed.length ? changed : 'none', '| added', added, '| expected', Object.values(result));
  S.close(); process.exit(changed.length ? 2 : 0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
