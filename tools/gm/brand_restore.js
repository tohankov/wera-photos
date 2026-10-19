// Owner 19.10.2026 (WERA allowed it): «Загальний title сайту» and «Опис сайту (для соцмереж)» UA/RU back to backup/settings_brand_before_20261019.json; «Назва магазину» stays «TL-Shop».
//   node gm/brand_restore.js dry | write  -> backup/settings_brand_before_restore_<ts>.json; dryRun per language; save; re-read
const fs = require('fs'); const S = require('../lib/session.js').open(); const MODE = process.argv[2] || 'dry'; const B = require('../../backup/settings_brand_before_20261019.json');
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
(async () => { const now = {}; for (const lang of ['ua', 'ru']) { const r = await S.call('horoshop_admin_settings_brand', { lang }); now[lang] = r.values || r.current || r; }
  const pick = v => ({ siteName: v.siteName, headerSite: v.headerSite, siteDescription: v.siteDescription });
  console.log('now', JSON.stringify({ ua: pick(now.ua), ru: pick(now.ru) }));
  if (now.ua.siteName !== 'TL-Shop') stop('siteName is not TL-Shop: ' + now.ua.siteName);
  if (MODE === 'write') fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/settings_brand_before_restore_${Date.now()}.json`, JSON.stringify({ ua: pick(now.ua), ru: pick(now.ru) }, null, 1));
  for (const lang of ['ua', 'ru']) { const set = { headerSite: B[lang].headerSite, siteDescription: B[lang].siteDescription };
    const r = await S.call('horoshop_admin_settings_brand', { lang, ...set, dryRun: MODE !== 'write' }); console.log(lang, MODE, JSON.stringify(r).slice(0, 600)); }
  if (MODE === 'write') for (const lang of ['ua', 'ru']) { const r = await S.call('horoshop_admin_settings_brand', { lang }); const v = r.values || r.current || r;
    console.log('verify', lang, v.headerSite === B[lang].headerSite && v.siteDescription === B[lang].siteDescription && v.siteName === 'TL-Shop' ? 'ok' : 'DIFF ' + JSON.stringify(pick(v))); }
  S.close(); })().catch(e => { console.error(e); S.close(); process.exit(1); });
