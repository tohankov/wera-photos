// Batch 5 (group А, last 18): 869/4 + 869/4 M 10 mm, 851/9 C J, 851/21 J, 867/9 C TORX, 867/9 C IP.
// Sizes from our series-table row (neighbour backup), texts from each WERA datasheet.
const V = require('../../lib/vt.js'), T = require('../../a422/tables.json');
const NB = Object.fromEntries(require('C:/Users/Techlight/Desktop/wera-photos/backup/b5_neighbours_before.json').response.products.map(p => [p.article, p]));
const row = a => { const n = T[a].unlinked.map(x => NB[x]).find(p => p && V.splitTable(p.description.ua)); const b = V.splitTable(n.description.ua)[1]; const h = V.headers(b), r = V.rowOf(b, a); return Object.fromEntries(h.map((x, i) => [x.label + (x.unit ? ' ' + x.unit : ''), r.vals[i]])); };
const HALF = { ua: 'Привід: хвостовик 4 мм Halfmoon (хвостовик Wera тип 9)', ru: 'Привод: хвостовик 4 мм Halfmoon (хвостовик Wera тип 9)' };
const HIOS = { ua: 'Привід: хвостовик 4 мм HIOS (хвостовик Wera тип 21)', ru: 'Привод: хвостовик 4 мм HIOS (хвостовик Wera тип 21)' };
const HARD = { ua: 'Тверде виконання', ru: 'Твёрдое исполнение' };
const out = {};
const add = (a, t, intro, feat) => { out[a] = { title: { ua: `${t.ua} WERA ${a}`, ru: `${t.ru} WERA ${a}` }, intro, feat: { ua: feat.map(x => x.ua), ru: feat.map(x => x.ru) } }; };
for (const a of require('./batch.json')) {
  const r = row(a), L = r['Довжина робочого кінця мм'], p = r['Профіль'];
  if (a === '05060235001' || a === '05060282001') {
    const m = a === '05060235001';
    add(a, { ua: `Торцева головка ${m ? 'магнітна 869/4 M' : 'немагнітна 869/4'} 10×65 мм`, ru: `Торцевая головка ${m ? 'магнитная 869/4 M' : 'немагнитная 869/4'} 10×65 мм` },
      { ua: `Торцева головка WERA ${m ? '869/4 M' : '869/4'} (WERA ${a}) для гвинтів із зовнішнім шестигранником під ключ 10 мм, загальна довжина 65 мм.${m ? ' Сильний постійний магніт утримує кріплення в головці.' : ' Немагнітне виконання.'}`,
        ru: `Торцевая головка WERA ${m ? '869/4 M' : '869/4'} (WERA ${a}) для винтов с наружным шестигранником под ключ 10 мм, общая длина 65 мм.${m ? ' Сильный постоянный магнит удерживает крепёж в головке.' : ' Немагнитное исполнение.'}` },
      [m ? { ua: 'Метричний розмір, з сильним постійним магнітом', ru: 'Метрический размер, с сильным постоянным магнитом' } : { ua: 'Метричний розмір, немагнітна', ru: 'Метрический размер, немагнитная' },
        { ua: 'Привід: зовнішній шестигранник 1/4″, для тримачів за DIN ISO 1173-F 6,3', ru: 'Привод: наружный шестигранник 1/4″, для держателей по DIN ISO 1173-F 6,3' }]);
  } else if (/^0513527/.test(a)) {
    add(a, { ua: `Біта з хвостовиком Halfmoon 4 мм 851/9 C J ${p}×${L} мм`, ru: `Бита с хвостовиком Halfmoon 4 мм 851/9 C J ${p}×${L} мм` },
      { ua: `Біта WERA 851/9 C J (WERA ${a}) для хрестових гвинтів ${p}, довжина ${L} мм, хвостовик 4 мм Halfmoon. Оптимізована для азійських (японських) гвинтів PH.`,
        ru: `Бита WERA 851/9 C J (WERA ${a}) для крестовых винтов ${p}, длина ${L} мм, хвостовик 4 мм Halfmoon. Оптимизирована для азиатских (японских) винтов PH.` },
      [{ ua: 'Оптимізована під азійські гвинти PH', ru: 'Оптимизирована под азиатские винты PH' }, HARD, HALF]);
  } else if (/^0513528/.test(a)) {
    add(a, { ua: `Біта з хвостовиком HIOS 4 мм 851/21 J ${p}×${L} мм`, ru: `Бита с хвостовиком HIOS 4 мм 851/21 J ${p}×${L} мм` },
      { ua: `Біта WERA 851/21 J (WERA ${a}) для хрестових гвинтів ${p}, довжина ${L} мм, хвостовик 4 мм HIOS. Оптимізована для азійських (японських) гвинтів PH.`,
        ru: `Бита WERA 851/21 J (WERA ${a}) для крестовых винтов ${p}, длина ${L} мм, хвостовик 4 мм HIOS. Оптимизирована для азиатских (японских) винтов PH.` },
      [{ ua: 'Оптимізована під азійські гвинти PH', ru: 'Оптимизирована под азиатские винты PH' }, HARD, HIOS]);
  } else if (/IP$/.test(p)) {
    const ip = p.replace(/\s*IP$/, '');
    add(a, { ua: `Біта TORX PLUS® з хвостовиком Halfmoon 4 мм 867/9 C IP ${ip}×${L} мм`, ru: `Бита TORX PLUS® с хвостовиком Halfmoon 4 мм 867/9 C IP ${ip}×${L} мм` },
      { ua: `Біта WERA 867/9 C IP TORX PLUS® (WERA ${a}) для гвинтів TORX PLUS® ${ip} IP, довжина ${L} мм. Хвостовик 4 мм Halfmoon — для прямого приєднання в машинний патрон.`,
        ru: `Бита WERA 867/9 C IP TORX PLUS® (WERA ${a}) для винтов TORX PLUS® ${ip} IP, длина ${L} мм. Хвостовик 4 мм Halfmoon — для прямого присоединения в машинный патрон.` },
      [HARD, HALF]);
  } else {
    add(a, { ua: `Біта TORX® з хвостовиком Halfmoon 4 мм 867/9 C ${p}×${L} мм`, ru: `Бита TORX® с хвостовиком Halfmoon 4 мм 867/9 C ${p}×${L} мм` },
      { ua: `Біта WERA 867/9 C TORX® (WERA ${a}) для гвинтів TORX® ${p}, довжина ${L} мм. Хвостовик 4 мм Halfmoon — для прямого приєднання в машинний патрон.`,
        ru: `Бита WERA 867/9 C TORX® (WERA ${a}) для винтов TORX® ${p}, длина ${L} мм. Хвостовик 4 мм Halfmoon — для прямого присоединения в машинный патрон.` },
      [HARD, HALF]);
  }
}
module.exports = out;
