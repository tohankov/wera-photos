// Batch 3: 867/4 Z TORX BO 70 mm (8). Title template from our existing BO bits, sizes from our series-table row, text from the WERA datasheet.
const V = require('../../lib/vt.js'), T = require('../../a422/tables.json');
const NB = Object.fromEntries(require('C:/Users/Techlight/Desktop/wera-photos/backup/b3_neighbours_before.json').response.products.map(p => [p.article, p]));
const out = {};
for (const a of require('./batch.json')) {
  const n = T[a].unlinked.map(x => NB[x]).find(Boolean); const b = V.splitTable(n.description.ua)[1]; const h = V.headers(b), r = V.rowOf(b, a);
  const v = Object.fromEntries(h.map((x, i) => [x.label + (x.unit ? ' ' + x.unit : ''), r.vals[i]]));
  const p = v['Профіль'].replace(/^TX\s*/, 'TX '), L = v['Довжина робочого кінця мм'];
  out[a] = {
    title: { ua: `Біта TORX® BO з отвором 867/4 Z ${p}×${L} мм WERA ${a}`, ru: `Бита TORX® BO с отверстием 867/4 Z ${p}×${L} мм WERA ${a}` },
    intro: {
      ua: `Біта WERA 867/4 Z TORX® BO (WERA ${a}) для гвинтів TORX® з цапфою розміру ${p}, довжина ${L} мм. Гвинти TORX® BO мають у профілі цапфу, тому звичайним інструментом TORX® їх не відкрити — біта BO має отвір у наконечнику, куди входить цапфа.`,
      ru: `Бита WERA 867/4 Z TORX® BO (WERA ${a}) для винтов TORX® с цапфой размера ${p}, длина ${L} мм. Винты TORX® BO имеют в профиле цапфу, поэтому обычным инструментом TORX® их не открыть — бита BO имеет отверстие в наконечнике, куда входит цапфа.` },
    feat: {
      ua: ['Отвір у наконечнику для гвинтів TORX® з цапфою (захист від несанкціонованого доступу)', 'Загартовані до в\'язкої твердості — для універсального застосування', 'Привід: зовнішній шестигранник 1/4″ (хвостовик Wera тип 4), для тримачів за DIN ISO 1173-F 6,3'],
      ru: ['Отверстие в наконечнике для винтов TORX® с цапфой (защита от несанкционированного доступа)', 'Закалены до вязкой твёрдости — для универсального применения', 'Привод: наружный шестигранник 1/4″ (хвостовик Wera тип 4), для держателей по DIN ISO 1173-F 6,3'] },
  };
}
module.exports = out;
