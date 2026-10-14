// 22 "customized" articles (decision 14.10.2026): ordinary products at RRP, "під замовлення / под заказ" before WERA in the title,
// first paragraph = the made-to-order note with the datasheet range. Sections = those of the ordinary (…001) versions. No variant tables.
const { parse } = require('./ds.js'); const { tr } = require('./dict.js');
const fs = require('fs'), path = require('path');
const SEC = JSON.parse(fs.readFileSync(path.join(__dirname, 'sections.json'), 'utf8'));
const DS = path.join(__dirname, '../../batch/ds');
const head = a => fs.readFileSync(path.join(DS, a + '.txt'), 'utf8').split('\n').slice(0, 3).map(l => l.slice(3)).join(' ');
const num = s => s.replace(/\./g, ',');
function feats(a) { const p = parse(a); const din = (p.desc.match(/DIN ISO 1173-[A-F] [\d,]+/) || [])[0]; const ua = [], ru = [];
  for (const f of p.feats) { const t = tr(f); if (t === null) continue; if (t === undefined) throw new Error(a + ' untranslated: ' + f); ru.push(t[0]); ua.push(t[1]); }
  return { ua, ru }; }
const note = (r, u) => ({ ua: `Виготовляється під замовлення: WERA налаштовує момент затягування на заводі під ваше значення в межах діапазону ${r} ${u.ua} — вкажіть потрібний момент при оформленні замовлення.`, ru: `Изготавливается под заказ: WERA настраивает момент затяжки на заводе под ваше значение в пределах диапазона ${r} ${u.ru} — укажите нужный момент при оформлении заказа.` });
const out = {};
const NM = { ua: 'Нм', ru: 'Нм' }, INLB = { ua: 'дюйм фунт-сила', ru: 'дюйм фунт-сила' };
for (const a of require('../bB2/batch.json').concat(['05074800010', '05074810010'])) {
  const h = head(a); const model = (h.match(/\b(74\d\d(?: ESD)?|1460 ESD)\b/) || [])[1] || (/^1460/.test(h) ? '1460 ESD' : null);
  const rm = h.match(/([\d.,]+)-([\d.,]+) ?(Nm|in\. ?lbs)/); const unit = /in/.test(rm[3]) ? INLB : NM; const r = `${num(rm[1])}–${num(rm[2])}`;
  const m = /^1460/.test(h) ? (require('../../a422/wtable.json')[a]?.['Artikelnummer [art. no.]'] || '1460 ESD') : (h.match(/\b74[5-6]\d\b/g) || []).pop() + (/ESD/.test(h) ? ' ESD' : '');
  const pistol = /пистолетная/.test(h), handle = (h.match(/длина ручки (\d+) mm/) || [])[1];
  const sec = /^1460/.test(h) || /745[56]/.test(m) ? 1205 : unit === INLB ? 1206 : 1204;
  const tUa = `Динамометрична викрутка із заводською уставкою моменту в діапазоні ${r} ${unit.ua}${pistol ? ', з пістолетною ручкою' : ''}, із швидкозатискним патроном${/^146/.test(m) ? '' : ' Rapidaptor'}, Kraftform ${m}, під замовлення`;
  const tRu = `Динамометрическая отвёртка с заводской уставкой момента в диапазоне ${r} ${unit.ru}${pistol ? ', с пистолетной ручкой' : ''}, с быстрозажимным патроном${/^146/.test(m) ? '' : ' Rapidaptor'}, Kraftform ${m}, под заказ`;
  const n = note(r, unit);
  const esd = /ESD/.test(m);
  out[a] = { noTable: true, parent: sec, title: { ua: `${tUa} WERA ${a}`, ru: `${tRu} WERA ${a}` }, lead: n,
    intro: { ua: `${n.ua}</p><p>Динамометрична викрутка WERA Kraftform ${m} (WERA ${a}) для серійних операцій, де важливо зберігати незмінний момент затягування.${esd ? ' Електростатично безпечне виконання ESD.' : ''} Змінити уставку в межах діапазону можна лише спеціальним інструментом із подальшою перевіркою контрольним приладом.`,
      ru: `${n.ru}</p><p>Динамометрическая отвёртка WERA Kraftform ${m} (WERA ${a}) для серийных операций, где важно сохранять неизменный момент затяжки.${esd ? ' Электростатически безопасное исполнение ESD.' : ''} Изменить уставку в пределах диапазона можно только специальным инструментом с последующей проверкой контрольным прибором.` },
    feat: feats(a),
    chars: { ua: [`Модель: Kraftform ${m}`, `Діапазон налаштування: ${r} ${unit.ua}`, ...(handle ? [`Довжина ручки: ${handle} мм`] : []), ...(pistol ? ['Ручка: пістолетної форми'] : []), 'Уставка: під замовлення, значення вказує покупець'],
      ru: [`Модель: Kraftform ${m}`, `Диапазон настройки: ${r} ${unit.ru}`, ...(handle ? [`Длина ручки: ${handle} мм`] : []), ...(pistol ? ['Ручка: пистолетной формы'] : []), 'Уставка: под заказ, значение указывает покупатель'] } };
}
// Click-Torque XP …010: same wrench as …001, pre-set to the customer's value
const WT = require('../../a422/wtable.json');
for (const [a, n] of [['05075670010', 1], ['05075671010', 2], ['05075672010', 3]]) { const w = WT[a]; const r = w['Hauptskala Messbereich [Nm]'].replace('-', '–').replace(/\./g, ','), q = w['Aufnahmegröße'].replace('x', '×');
  const lead = note(r, NM);
  out[a] = { noTable: true, parent: SEC.ctxp, title: { ua: `Динамометричний ключ Click-Torque XP ${n} з уставкою моменту, для змінних інструментів ${q} мм, ${r} Нм, під замовлення WERA ${a}`, ru: `Динамометрический ключ Click-Torque XP ${n} с уставкой момента, для сменных инструментов ${q} мм, ${r} Нм, под заказ WERA ${a}` },
    intro: { ua: `${lead.ua}</p><p>Динамометричний ключ WERA Click-Torque XP ${n} (WERA ${a}) з уставкою моменту затягування — для серійних операцій, де потрібен той самий момент і повторюваність. При досягненні моменту — чутне й відчутне клацання. Гніздо ${q} мм для змінних насадок, затягування правого та лівого різьблення.`,
      ru: `${lead.ru}</p><p>Динамометрический ключ WERA Click-Torque XP ${n} (WERA ${a}) с уставкой момента затяжки — для серийных операций, где нужен один и тот же момент и повторяемость. При достижении момента — слышимый и ощутимый щелчок. Гнездо ${q} мм для сменных насадок, затяжка правой и левой резьбы.` },
    feat: feats(a),
    chars: { ua: [`Посадковий розмір: ${q} мм`, `Діапазон налаштування: ${r} Нм`, `Довжина ключа: ${w['Länge Drehmomentschlüssel [mm]']} мм`, 'Уставка: під замовлення, значення вказує покупець'], ru: [`Посадочный размер: ${q} мм`, `Диапазон настройки: ${r} Нм`, `Длина ключа: ${w['Länge Drehmomentschlüssel [mm]']} мм`, 'Уставка: под заказ, значение указывает покупатель'] } };
}
// SEO description: the product sentence, marked as made to order (the long note itself does not fit 160 chars)
for (const c of Object.values(out)) c.seo = { ua: 'Під замовлення. ' + c.intro.ua.split('</p><p>')[1], ru: 'Под заказ. ' + c.intro.ru.split('</p><p>')[1] };
module.exports = out;
