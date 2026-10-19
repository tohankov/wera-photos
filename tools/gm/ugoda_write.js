// Owner 19.10.2026: RU text of «Угода користувача» (page 1052) = inventory/ugoda_ru_preview.html (translation of the UA text, same HTML structure).
//   node gm/ugoda_write.js dry | write  -> backup/ugoda_before_<ts>.json; checks: the live UA text has the same tag sequence as the translation, the live RU text
//   is still the old one (= UA); dryRun touches only extra[i18n][1][text]; save; re-read must equal the file; the storefront /ru/ page shows the new heading.
const fs = require('fs'); const MODE = process.argv[2] || 'dry'; const S = require('../lib/session.js').open();
const F = 'extra[i18n][1][text]', FUA = 'extra[i18n][3][text]'; const RU = fs.readFileSync('C:/Users/Techlight/Desktop/wera-photos/inventory/ugoda_ru_preview.html', 'utf8');
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const tags = s => (s.match(/<\/?[a-z0-9]+/gi) || []).join(' '); const norm = s => s.replace(/\r\n/g, '\n').trim();
(async () => { const r = await S.call('horoshop_admin_record_get', { entity: 'pages', id: 1052, fields: [F, FUA], allowLarge: true }); const old = r.fields && r.fields[F], ua = r.fields && r.fields[FUA];
  if (typeof old !== 'string' || typeof ua !== 'string') stop('read ' + JSON.stringify(r).slice(0, 200));
  console.log('live RU', old.length, 'live UA', ua.length, 'new RU', RU.length, 'RU == UA now', norm(old) === norm(ua));
  if (tags(ua) !== tags(RU)) stop('tag sequence of the translation differs from the live UA text');
  if (norm(old) === norm(RU)) stop('already written');
  if (/Положение об обработке|Положение об&nbsp;обработке/.test(old)) stop('live RU is already a Russian text — not overwriting');
  if (MODE === 'write') fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/ugoda_before_${Date.now()}.json`, JSON.stringify({ [F]: old, [FUA]: ua }));
  const s = await S.call('horoshop_admin_record_save', { entity: 'pages', id: 1052, set: { [F]: RU }, dryRun: MODE !== 'write' });
  const ch = s.willChange || s.changes || []; console.log(MODE, 'fields', ch.map(c => c.field + (c.persisted === undefined ? '' : ' persisted ' + c.persisted)).join(', ') || JSON.stringify(s).slice(0, 300));
  if (!ch.length || ch.some(c => c.field !== F)) stop('unexpected answer');
  if (MODE === 'write') { const a = await S.call('horoshop_admin_record_get', { entity: 'pages', id: 1052, fields: [F, FUA], allowLarge: true });
    console.log('verify RU', norm(a.fields[F]) === norm(RU) ? 'ok' : 'DIFF', 'UA unchanged', a.fields[FUA] === ua ? 'ok' : 'CHANGED'); }
  S.close(); })().catch(e => { console.error(e); S.close(); process.exit(1); });
