// Control table of every VISIBLE article of a group for the example (owner 26.10.2026: «контрольная таблица по каждому артикулу docs/global_<группа>_items.csv»):
// what the group's plans will change — name, characteristics, description, photos — plus sections and the wera.de page. UTF-8 BOM, «;».
//   node cat/global_items_csv.js <group live.json> <global_<gid>.json> <menu_tree.json> <out.csv> names=<set.json> chars=<json {art:{key:[v]}}> desc=<plan.json> [desc=…] block=<plan.json> wait=<_wait.json>
const fs = require('fs'), path = require('path'); const [, , LIVE, GJ, MT, OUT, ...opt] = process.argv;
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const J = JSON.parse(fs.readFileSync(GJ, 'utf8')); const G = Object.fromEntries(J.products.map(p => [p.art, p]));
const M = JSON.parse(fs.readFileSync(MT, 'utf8')); const sec = id => (M.find(s => s.id === +id) || {}).path || id; const W = require('../../inventory/wera/pages.json'); const T = require('./char_titles.js');
const arg = k => opt.filter(o => o.startsWith(k + '=')).map(o => JSON.parse(fs.readFileSync(o.slice(k.length + 1), 'utf8')));
const names = Object.assign({}, ...arg('names')), chars = Object.assign({}, ...arg('chars')); const desc = {}; for (const P of [...arg('desc'), ...arg('block')]) for (const [a, x] of Object.entries(P.products)) (desc[a] = desc[a] || []).push(...x.why);
const wait = Object.fromEntries(arg('wait').flatMap(w => w.wait.map(x => [x.art, x.why.join(', ')])));
const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
const rows = [['Артикул', 'Название сейчас', 'Название станет', 'Характеристики станут', 'Описание', 'Блок состава ждёт', 'Фото', 'wera.de', 'Разделы', 'Ссылка'].map(q).join(';')];
for (const p of L) { const a = p.article; const g = G[a] || { list: [] }; const ph = g.list.filter(f => f.item === 7).map(f => f.what + (f.detail ? ' (' + f.detail + ')' : '')).join('; ');
  const ch = Object.entries(chars[a] || {}).map(([k, v]) => `${T[k] || k}: ${v.join(', ')}`).join('; ');
  rows.push([a, p.mod_title.ua, names[a] ? names[a].ua : '', ch, [...new Set(desc[a] || [])].join('; '), wait[a] || '', ph, W.status[a] === 200 ? W.art[a] : 'нет страницы (' + (W.status[a] || '—') + ')',
    [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].filter(Boolean).map(sec).join(' | '), p.link].map(q).join(';')); }
fs.writeFileSync(OUT, '﻿' + rows.join('\n')); console.log('rows', rows.length - 1, '->', OUT);
