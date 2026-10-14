// Group А, batch 6 (24, photo fix): 869/4 (11) and 869/4 M (10) nut-setters, 868/4 square bits (3).
// Size from our series-table row (metric mm or inch); texts from the WERA datasheets (same wording as batch b5 / b1 for 869/4).
const V = require('../../lib/vt.js'), T = require('../../a422/tables.json');
const NB = Object.fromEntries(require('C:/Users/Techlight/Desktop/wera-photos/backup/bA6_neighbours_before.json').response.products.map(p => [p.article, p]));
const row = a => { const n = T[a].unlinked.map(x => NB[x]).find(p => p && V.splitTable(p.description.ua)); const b = V.splitTable(n.description.ua)[1]; const h = V.headers(b), r = V.rowOf(b, a); return Object.fromEntries(h.map((x, i) => [x.label + (x.unit ? ' ' + x.unit : ''), r.vals[i]])); };
const DRIVE = { ua: 'Привід: зовнішній шестигранник 1/4″, для тримачів за DIN ISO 1173-F 6,3', ru: 'Привод: наружный шестигранник 1/4″, для держателей по DIN ISO 1173-F 6,3' };
const out = {};
for (const a of require('./batch.json')) {
  const r = row(a);
  if (/^0506018/.test(a)) {
    const p = r['Профіль'].replace('# ', '#'), L = r['Довжина робочого кінця мм'];
    out[a] = { title: { ua: `Біта для гвинтів із внутрішнім квадратом 868/4 ${p}×${L} мм WERA ${a}`, ru: `Бита для винтов с внутренним квадратом 868/4 ${p}×${L} мм WERA ${a}` },
      intro: { ua: `Біта WERA 868/4 (WERA ${a}) для гвинтів із внутрішнім квадратом ${p}, довжина ${L} мм. Подовжена біта з шестигранним хвостовиком 1/4″ — для гвинтів у заглибленнях і важкодоступних місцях.`, ru: `Бита WERA 868/4 (WERA ${a}) для винтов с внутренним квадратом ${p}, длина ${L} мм. Удлинённая бита с шестигранным хвостовиком 1/4″ — для винтов в углублениях и труднодоступных местах.` },
      feat: { ua: ['Загартовані до в\'язкої твердості — для універсального застосування', 'Захищає наконечник від передчасного виходу з ладу', 'Привід: зовнішній шестигранник 1/4″ (хвостовик Wera тип 4), для тримачів за DIN ISO 1173-F 6,3'], ru: ['Закалены до вязкой твёрдости — для универсального применения', 'Защищает наконечник от преждевременного выхода из строя', 'Привод: наружный шестигранник 1/4″ (хвостовик Wera тип 4), для держателей по DIN ISO 1173-F 6,3'] } };
    continue;
  }
  const m = T[a] && /M/.test(require('../../batch/order.json').find(o => o.a === a)?.t.split(' ')[1] || '');
  const mm = r['Розмір мм'] && r['Розмір мм'] !== '-' ? r['Розмір мм'].replace(/,0$/, '') : null, inch = r['Розмір дюйми'] && r['Розмір дюйми'] !== '-' ? r['Розмір дюйми'] : null;
  const size = mm || inch, unitUA = mm ? ' мм' : '', L = r['Загальна довжина мм'].replace(/,0$/, '');
  const model = m ? '869/4 M' : '869/4';
  out[a] = { title: { ua: `Торцева головка ${m ? 'магнітна' : 'немагнітна'} ${model} ${size}×${L} мм WERA ${a}`, ru: `Торцевая головка ${m ? 'магнитная' : 'немагнитная'} ${model} ${size}×${L} мм WERA ${a}` },
    intro: { ua: `Торцева головка WERA ${model} (WERA ${a}) для гвинтів із зовнішнім шестигранником під ключ ${size}${unitUA}, загальна довжина ${L} мм.${m ? ' Сильний постійний магніт утримує кріплення в головці.' : ' Немагнітне виконання.'}`,
      ru: `Торцевая головка WERA ${model} (WERA ${a}) для винтов с наружным шестигранником под ключ ${size}${unitUA}, общая длина ${L} мм.${m ? ' Сильный постоянный магнит удерживает крепёж в головке.' : ' Немагнитное исполнение.'}` },
    feat: { ua: [`${mm ? 'Метричний' : 'Дюймовий'} розмір, ${m ? 'з сильним постійним магнітом' : 'немагнітна'}`, DRIVE.ua], ru: [`${mm ? 'Метрический' : 'Дюймовый'} размер, ${m ? 'с сильным постоянным магнитом' : 'немагнитная'}`, DRIVE.ru] } };
}
module.exports = out;
