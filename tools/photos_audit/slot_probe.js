// dryRun of horoshop_admin_upload_image into each image slot of one product: which slot holds which stored photo (read-only)
//   node photos_audit/slot_probe.js <article> <png>
const fs = require('fs'); const S = require('../lib/session.js').open(); const [, , art, png] = process.argv; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const l = await S.call('horoshop_admin_list', { entity: 'products', search: art }); const id = l.records[0].id;
  const g = await S.call('horoshop_admin_record_get', { entity: 'products', id, fields: ['images'] }); const ex = await S.call('horoshop_catalog_export', { expr: { article: [art] }, includedParams: ['article', 'images'], limit: 5 });
  console.log('id', id, 'export images', JSON.stringify(ex.response.products[0].images.map(u => u.split('/').pop())));
  const b64 = fs.readFileSync(png).toString('base64');
  for (const f of g.fileFields.slice(0, 2)) { await sleep(1500); const r = await S.call('horoshop_admin_upload_image', { entity: 'products', id, field: f, base64: b64, dryRun: true });
    const o = JSON.parse(JSON.stringify(r)); if (o.previousImage) o.previousImage.base64 = '(' + (o.previousImage.base64 || '').length + ' chars)'; console.log(f, JSON.stringify(o).slice(0, 900)); }
  S.close(); })();
