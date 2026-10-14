// Batch 4: 871/4 TORQ-SET Mplus (3), 867/2 Z TORX (2), 800/1 Z (2), 867/4 IP TORX PLUS (3). Sizes from our series-table row, drive from each datasheet.
const fs = require('fs'), path = require('path'), V = require('../../lib/vt.js'), T = require('../../a422/tables.json');
const NB = Object.fromEntries(require('C:/Users/Techlight/Desktop/wera-photos/backup/b4_neighbours_before.json').response.products.map(p => [p.article, p]));
const row = a => { const n = T[a].unlinked.map(x => NB[x]).find(Boolean); const b = V.splitTable(n.description.ua)[1]; const h = V.headers(b), r = V.rowOf(b, a); return Object.fromEntries(h.map((x, i) => [x.label + (x.unit ? ' ' + x.unit : ''), r.vals[i]])); };
const drive = a => { const t = fs.readFileSync(path.join(__dirname, '../../batch/ds/' + a + '.txt'), 'utf8'); const m = t.match(/Привод: наружный шестигранник ([\d/]+)" \(тип хвостовика Wera (\d+)\)/); const std = (t.match(/DIN ISO 1173-([A-Z]) ([0-9]+(?:,[0-9]+)?)/) || []); const din = std[1], iso = std[2]; const sz = m[1] + '″';
  return { ua: `Привід: зовнішній шестигранник ${sz} (хвостовик Wera тип ${m[2]}), для тримачів за DIN ISO 1173-${din} ${iso}`, ru: `Привод: наружный шестигранник ${sz} (хвостовик Wera тип ${m[2]}), для держателей по DIN ISO 1173-${din} ${iso}` }; };
const TOUGH = { ua: 'Загартовані до в\'язкої твердості — для універсального застосування', ru: 'Закалены до вязкой твёрдости — для универсального применения' };
const out = {};
for (const a of require('./batch.json')) {
  const r = row(a), d = drive(a), L = r['Довжина робочого кінця мм'];
  let t, intro, feat = [TOUGH, d];
  if (a.startsWith('050666')) { const s = r['Розмір мм'].replace(',0', ''); t = { ua: `Біта TORQ-SET® Mplus 871/4 ${s}×${L} мм`, ru: `Бита TORQ-SET® Mplus 871/4 ${s}×${L} мм` };
    intro = { ua: `Біта WERA 871/4 TORQ-SET® Mplus (WERA ${a}) для гвинтів TORQ-SET® розміру ${s} мм, довжина ${L} мм. Міцніші грані, ніж у звичайного профілю TORQ-SET®, дають на 70% більший момент на злам при точній посадці в гвинті і довший строк служби.`,
      ru: `Бита WERA 871/4 TORQ-SET® Mplus (WERA ${a}) для винтов TORQ-SET® размера ${s} мм, длина ${L} мм. Более прочные грани, чем у обычного профиля TORQ-SET®, дают на 70% больший момент на излом при точной посадке в винте и больший срок службы.` }; }
  else if (a.startsWith('050669')) { const p = r['Профіль']; t = { ua: `Біта TORX® 867/2 Z ${p}×${L} мм`, ru: `Бита TORX® 867/2 Z ${p}×${L} мм` };
    intro = { ua: `Біта WERA 867/2 Z TORX® (WERA ${a}) для гвинтів TORX® ${p}, довжина ${L} мм, з шестигранним хвостовиком 5/16″.`, ru: `Бита WERA 867/2 Z TORX® (WERA ${a}) для винтов TORX® ${p}, длина ${L} мм, с шестигранным хвостовиком 5/16″.` }; }
  else if (a.startsWith('050720')) { const s = `${r['Товщина робочого кінця мм']}×${r['Ширина робочого кінця мм']}`; t = { ua: `Біта шліцева 800/1 Z SL ${s}×${L} мм`, ru: `Бита шлицевая 800/1 Z SL ${s}×${L} мм` };
    intro = { ua: `Біта WERA 800/1 Z (WERA ${a}) для гвинтів зі шліцем ${s} мм, довжина ${L} мм.`, ru: `Бита WERA 800/1 Z (WERA ${a}) для винтов со шлицем ${s} мм, длина ${L} мм.` }; }
  else { const p = r['Профіль'].replace(/\s*IP$/, ''); t = { ua: `Біта TORX PLUS® 867/4 IP ${p}×${L} мм`, ru: `Бита TORX PLUS® 867/4 IP ${p}×${L} мм` };
    intro = { ua: `Біта WERA 867/4 IP (WERA ${a}) для гвинтів TORX PLUS® ${p} IP, довжина ${L} мм. У профілю TORX PLUS® шість граней еліпсоїдної форми замість круглої — більша площа передачі зусилля, більший момент і довший строк служби гвинтів та інструменту.`,
      ru: `Бита WERA 867/4 IP (WERA ${a}) для винтов TORX PLUS® ${p} IP, длина ${L} мм. У профиля TORX PLUS® шесть граней эллипсоидной формы вместо круглой — больше площадь передачи усилия, больший момент и срок службы винтов и инструмента.` }; }
  out[a] = { title: { ua: `${t.ua} WERA ${a}`, ru: `${t.ru} WERA ${a}` }, intro, feat: { ua: feat.map(x => x.ua), ru: feat.map(x => x.ru) } };
}
module.exports = out;
