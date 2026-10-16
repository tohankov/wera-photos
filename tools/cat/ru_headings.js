// RU translations of characteristic headings that were not yet in the interface table at seed time. node cat/ru_headings.js
const S = require('../lib/session.js').open(); const sleep = ms => new Promise(r => setTimeout(r, ms));
const H = { 'Приєднання до інструмента': 'Присоединение к инструменту', 'Приєднання насадки': 'Присоединение насадки', 'Діаметр свердла': 'Диаметр сверла', 'Різьба': 'Резьба' };
(async () => { for (const [ua, ru] of Object.entries(H)) { await sleep(1000); const g = await S.call('horoshop_admin_interface_translation_get', { search: ua, lang: 'ru' }); const row = (g.rows || []).find(x => x.key === ua && x.lang === 'ru');
    if (!row) { console.log(ua, 'row not found', (g.rows || []).slice(0, 3).map(r => r.key + '=' + r.value).join(' | ')); continue; }
    if (row.value) { console.log(ua, 'already', row.value); continue; } const s = await S.call('horoshop_admin_interface_translation_set', { id: row.id, value: ru, dryRun: false }); console.log(ua, '→', ru, JSON.stringify(s).slice(0, 120)); }
  S.close(); process.exit(0); })();
