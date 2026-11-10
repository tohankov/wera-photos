// «Динамометричний інструмент» (1195) — text facts by WERA (rule Б: only the fact, the wording stays), extra for cat/global_desc_plan.js. 10.11.2026.
//  1. torque indicators 300 / 400: «Виконання: (наконечник) Black Point» — WERA (datasheet, wera.de) does not name Black Point for the indicators -> the line goes;
//     05027913001 «Hex-Plus, наконечник Black Point» -> «Hex-Plus» (Hex-Plus — the datasheet p. 3)
//  2. 300 pistol indicators: «Шестигранник, 8 мм, з обточкою» — wera.de «Schlanke, auf 4 mm überdrehte Sechskantklingen» -> «Шестигранник, з обточкою до 4 мм»
//  3. Click-Torque X 6 / C 5: «(максимальне значення: 340 Нм)» — neither the datasheet («Диапазон измерения: 80-400 Nm») nor wera.de -> removed
//  4. 7786 TX 18 (new variant table): total length 62,2 мм — the datasheet title (wera.de has the two length columns swapped)
module.exports = (p, l, h) => { const why = []; let x = h;
  const bp = l === 'ua' ? /<p><strong>Виконання:<\/strong>\s*(?:наконечник )?Black Point<\/p>/g : /<p><strong>Исполнение:<\/strong>\s*(?:наконечник )?Black Point<\/p>/g;
  if (bp.test(x)) { x = x.replace(bp, ''); why.push('Black Point — WERA не называет (паспорт, wera.de)'); }
  if (/Hex-Plus, наконечник Black Point/.test(x)) { x = x.replace('Hex-Plus, наконечник Black Point', 'Hex-Plus'); why.push('Black Point — WERA не называет (паспорт, wera.de)'); }
  const h8 = l === 'ua' ? ['Шестигранник, 8 мм, з обточкою', 'Шестигранник, з обточкою до 4 мм'] : ['Шестигранник, 8 мм, с обточкой', 'Шестигранник, с обточкой до 4 мм'];
  if (x.includes(h8[0])) { x = x.split(h8[0]).join(h8[1]); why.push('шестигранник с обточкой до 4 мм — wera.de («auf 4 mm überdrehte Sechskantklingen»)'); }
  const m340 = l === 'ua' ? ' (максимальне значення: 340 Нм)' : ' (максимальное значение: 340 Нм)';
  if (x.includes(m340)) { x = x.split(m340).join(''); why.push('«340 Нм» — нет в паспорте и на wera.de'); }
  if (p.article.startsWith('0507871') && x.includes('<td>37,2</td><td>62,2</td>')) { x = x.replace('<td>37,2</td><td>62,2</td>', '<td>62,2</td><td>37,2</td>'); why.push('7786 TX 18: загальна довжина 62,2 мм — паспорт (на wera.de колонки переставлені)'); }
  return { html: x, why }; };
