// Manual steps for one batch (the full pipeline is lib/run_batch.js):
//   node lib/batch.js <batchDir> payload            -> <batchDir>/payload_new.json
//   node lib/batch.js <batchDir> links <links.json> -> <batchDir>/payload_links.json (prints neighbours whose table would change beyond links)
//   node lib/batch.js <batchDir> photos             -> images/<name>/<art>.jpg from photosrc.json
const fs = require('fs'), path = require('path'); const V = require('./vt.js'); const { makeBuilder, REPO } = require('./build.js');
const [, , dir, cmd, linksFile] = process.argv; const B = makeBuilder(dir); const arts = B.load('batch.json');
(async () => {
  if (cmd === 'photos') { const sharp = require('sharp'); const src = B.load('photosrc.json'); fs.mkdirSync(REPO + 'images/' + B.NAME, { recursive: true }); for (const a of arts) await V.squarePhoto(sharp, src[a], REPO + 'images/' + B.NAME + '/' + a + '.jpg'); console.log('photos', arts.length); }
  if (cmd === 'payload') { const products = B.payloadNew(arts); fs.writeFileSync(path.join(B.D, 'payload_new.json'), JSON.stringify({ products }, null, 1)); console.log('payload', products.length); }
  if (cmd === 'links') { const r = B.payloadLinks(arts, JSON.parse(fs.readFileSync(linksFile, 'utf8'))); fs.writeFileSync(path.join(B.D, 'payload_links.json'), JSON.stringify({ products: r.products })); console.log('links payload', r.products.length, 'problems', r.problems.length ? r.problems : 'none'); if (r.problems.length) process.exit(2); }
})();
