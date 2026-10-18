// Store SEO templates (admin «SEO шаблоны», entity seo_templates) — owner decision 18.10.2026. node names/seo_templates_write.js [write]
// Backup of all 17 templates before: backup/seo_templates_before.json. Only UA (i18n 3) and RU (i18n 1) change; {site} stays as it is.
// Delivery wording «… або самовивіз у Полтаві» (owner, 18.10.2026): the templates as they were before it — backup/seo_templates_before_delivery.json.
const fs = require('fs'); const S = require('../lib/session.js').open(); const WRITE = process.argv[2] === 'write';
const DLU = 'доставка Новою поштою або самовивіз у Полтаві.', DLR = 'доставка Новой почтой или самовывоз в Полтаве.';
const DU = `офіційного дистриб'ютора WERA в Україні. Гарантія виробника 12 міс., ${DLU}`, DR = `официального дистрибьютора WERA в Украине. Гарантия производителя 12 мес., ${DLR}`;
const F = '{filter[name(:) value](,)}';
const T = {
  31: ['{mod_title} — купити | TL-Shop', '{mod_title} — купить | TL-Shop'],                                   // product meta title
  32: [`{mod_title} — ціна {price}. Офіційний дистриб'ютор в Україні, гарантія виробника 12 міс., ${DLU}`,   // {price} renders «458 грн»
       `{mod_title} — цена {price}. Официальный дистрибьютор в Украине, гарантия производителя 12 мес., ${DLR}`],
  23: ['{title} WERA — купити | TL-Shop', '{title} WERA — купить | TL-Shop'],                                 // category meta title
  24: [`{title} — купити в TL-Shop, ${DU}`, `{title} — купить в TL-Shop, ${DR}`],                              // category meta description (no price: {price_min} is empty on parent categories)
  25: [`{title} ${F} WERA — купити | TL-Shop`, `{title} ${F} WERA — купить | TL-Shop`],                       // filter meta title
  26: [`{title} ${F} — купити в TL-Shop, ${DU}`, `{title} ${F} — купить в TL-Shop, ${DR}`] };              // filter meta description
(async () => { const bk = 'C:/Users/Techlight/Desktop/wera-photos/backup/seo_templates_before_delivery.json';
  if (WRITE && !fs.existsSync(bk)) { const b = {}; for (const id of Object.keys(T)) { await new Promise(r => setTimeout(r, 1200)); b[id] = await S.call('horoshop_admin_record_get', { entity: 'seo_templates', id }); }
    fs.writeFileSync(bk, JSON.stringify(b)); }
  for (const [id, [ua, ru]] of Object.entries(T)) { await new Promise(r => setTimeout(r, 1200));
    const r = await S.call('horoshop_admin_record_save', { entity: 'seo_templates', id, dryRun: !WRITE, allowPlaceholderLoss: true, set: { 'names[i18n][3][handler]': ua, 'names[i18n][1][handler]': ru } });
    const ch = (r.willChange || r.changes || []).map(c => c.field); const off = ch.filter(f => !/names\[i18n\]\[[13]\]\[handler\]/.test(f));
    if (r.error || off.length) { console.log('STOP', id, off, JSON.stringify(r).slice(0, 500)); process.exit(2); }
    console.log(id, WRITE ? 'saved' : 'dryRun', JSON.stringify(r.willChange || r.changes || r.verified || r.setFields || r).slice(0, 400)); }
  S.close(); })();
