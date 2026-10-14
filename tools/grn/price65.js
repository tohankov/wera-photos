// 65 price differences: our price vs GRN site vs GRN price list RRP (half-up to UAH). Read-only -> inventory/price_check_65.xlsx
const ExcelJS = require('exceljs');
const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const halfUp = x => Math.floor(x + 0.5);
(async () => {
  const cmp = new ExcelJS.Workbook(); await cmp.xlsx.readFile(INV + 'grn_compare.xlsx');
  const diff = []; cmp.getWorksheet('Разница в цене').eachRow((r, i) => { if (i > 1) diff.push({ article: String(r.getCell(1).value), ours: +r.getCell(2).value, grn: +r.getCell(3).value, our_url: r.getCell(6).value, grn_url: r.getCell(7).value }); });
  const pl = new ExcelJS.Workbook(); await pl.xlsx.readFile(INV + 'wera_price.xlsx');
  const rrp = {}; pl.getWorksheet('WERA 2026 GRN').eachRow((r, i) => { const a = String(r.getCell(3).value ?? '').replace(/\s/g, ''); const v = r.getCell(5).value; if (/^0?5\d{9}$/.test(a) && typeof v === 'number') { const k = a.padStart(11, '0'); if (!(k in rrp)) rrp[k] = v; } });
  const ours = {}; for (const p of require('./ours.json')) ours[p.article] = p;
  const rows = diff.map(d => {
    let raw = rrp[d.article], pack = 1;
    // price list RRP may be per pack (DIY bit packs): try RRP/N when it explains our or GRN price
    if (raw != null && halfUp(raw) !== d.ours && halfUp(raw) !== d.grn) { for (const n of [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 50, 100]) { const u = raw / n; if ([halfUp(u), Math.floor(u), Math.ceil(u)].some(v => v === d.ours || v === d.grn)) { pack = n; raw = u; break; } } }
    const r = raw != null ? halfUp(raw) : null;
    let group, note = '';
    if (r == null) group = 'Г — нет в прайсе';
    else if (d.grn === r && d.ours !== r) group = 'А — сайт GRN = прайс, у нас ошибка';
    else if (d.ours === r && d.grn !== r) group = d.grn > r ? 'Б↑ — наша = прайс, GRN дороже прайса' : 'Б↓ — наша = прайс, GRN дешевле прайса';
    else group = 'В — все три разные';
    const small = Math.abs(d.ours - d.grn) <= 2;
    if (small) {
      if (raw == null) note = 'нет в прайсе — не проверить';
      else {
        const fl = Math.floor(raw), ce = Math.ceil(raw), fr = Math.round((raw - fl) * 100) / 100;
        const oursRule = d.ours === halfUp(raw) ? 'half-up' : d.ours === fl ? 'вниз' : d.ours === ce ? 'вверх' : null;
        const grnRule = d.grn === halfUp(raw) ? 'half-up' : d.grn === fl ? 'вниз' : d.grn === ce ? 'вверх' : null;
        note = oursRule && grnRule ? `округление: РРЦ ${raw.toFixed(2)} (дробь ${fr}); наша — ${oursRule}, GRN — ${grnRule}` : `не округление: РРЦ ${raw.toFixed(2)}, наша ${d.ours}, GRN ${d.grn}`;
      }
    }
    return { article: d.article, title: ours[d.article]?.title?.ua || '', ours: d.ours, grn: d.grn, rrp_raw: raw != null ? Math.round(raw * 10000) / 10000 : '', rrp: r ?? '', pack: pack > 1 ? 'РРЦ в прайсе за ' + pack + ' шт., взято РРЦ/' + pack : '', group, diff_ours_grn: d.ours - d.grn, diff_grn_rrp: r != null ? d.grn - r : '', diff_ours_rrp: r != null ? d.ours - r : '', small_1_2: small ? 'да' : '', rounding_note: note, our_url: d.our_url, grn_url: d.grn_url };
  });
  const order = ['А', 'Б↑', 'Б↓', 'В', 'Г'];
  rows.sort((a, b) => order.findIndex(o => a.group.startsWith(o)) - order.findIndex(o => b.group.startsWith(o)) || Math.abs(b.diff_ours_grn) - Math.abs(a.diff_ours_grn));
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('65 расхождений');
  ws.columns = [['article', 'Артикул', 14], ['title', 'Название (наше)', 70], ['ours', 'Наша цена', 11], ['grn', 'Сайт GRN', 11], ['rrp', 'РРЦ прайс (half-up)', 13], ['rrp_raw', 'РРЦ прайс (как есть)', 14], ['pack', 'Упаковка', 30], ['group', 'Вывод', 40], ['diff_ours_grn', 'Наша − GRN', 11], ['diff_grn_rrp', 'GRN − РРЦ', 11], ['diff_ours_rrp', 'Наша − РРЦ', 11], ['small_1_2', 'Разница 1–2 грн', 10], ['rounding_note', 'Округление?', 60], ['our_url', 'Наш товар', 50], ['grn_url', 'Товар GRN', 45]].map(([key, header, width]) => ({ key, header, width }));
  rows.forEach(r => ws.addRow(r)); ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; ws.autoFilter = { from: 'A1', to: { row: 1, column: 15 } };
  const counts = {}; for (const r of rows) counts[r.group] = (counts[r.group] || 0) + 1;
  const s = wb.addWorksheet('Итог'); s.columns = [{ header: 'Группа', key: 'g', width: 50 }, { header: 'Кол-во', key: 'n', width: 10 }];
  for (const o of order) for (const [g, n] of Object.entries(counts)) if (g.startsWith(o)) s.addRow({ g, n });
  const sm = rows.filter(r => r.small_1_2); s.addRow({}); s.addRow({ g: 'Разница 1–2 грн', n: sm.length }); s.addRow({ g: '  из них округление', n: sm.filter(r => r.rounding_note.startsWith('округление')).length }); s.addRow({ g: '  из них не округление', n: sm.filter(r => r.rounding_note.startsWith('не округление')).length });
  s.getRow(1).font = { bold: true };
  await wb.xlsx.writeFile(INV + 'price_check_65.xlsx');
  console.log('total', rows.length, JSON.stringify(counts, null, 1));
  console.log('small', sm.length); for (const r of sm) console.log('  ', r.article, r.ours, r.grn, r.rrp_raw, '|', r.group.split(' ')[0], '|', r.rounding_note);
  for (const g of ['Б↑', 'Б↓', 'В']) { console.log('--', g); for (const r of rows.filter(r => r.group.startsWith(g)).slice(0, 6)) console.log('  ', r.article, '|', r.title.slice(0, 60), '| наша', r.ours, '| GRN', r.grn, '| РРЦ', r.rrp); }
  console.log('packs', rows.filter(r => r.pack).map(r => r.article + ':' + r.pack.split(',')[0]).join(' ')); console.log('-- А'); for (const r of rows.filter(r => r.group.startsWith('А')).slice(0, 5)) console.log('  ', r.article, '| наша', r.ours, '| GRN', r.grn, '| РРЦ', r.rrp);
})();
