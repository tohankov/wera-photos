// Price for each of the 422: GRN site price; if GRN is below the price-list RRP by more than rounding -> RRP half-up. Pack-priced RRP (DIY bit packs) handled as RRP/N. -> price.json
const ExcelJS = require('exceljs'), fs = require('fs');
const halfUp = x => Math.floor(x + 0.5);
(async () => {
  const pl = new ExcelJS.Workbook(); await pl.xlsx.readFile('C:/Users/Techlight/Desktop/wera-photos/inventory/wera_price.xlsx');
  const rrp = {}; pl.getWorksheet('WERA 2026 GRN').eachRow(r => { const a = String(r.getCell(3).value ?? '').replace(/\s/g, ''); const v = r.getCell(5).value; if (/^0?5\d{9}$/.test(a) && typeof v === 'number') { const k = a.padStart(11, '0'); if (!(k in rrp)) rrp[k] = v; } });
  const out = {}; const cnt = {};
  for (const r of require('./list.json')) {
    const g = r.grn_price === '' || r.grn_price == null ? null : +r.grn_price; let raw = rrp[r.article] ?? null, pack = 1;
    if (raw != null && g != null && halfUp(raw) !== g) for (const n of [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 50, 100]) { const u = raw / n; if ([halfUp(u), Math.floor(u), Math.ceil(u)].includes(g)) { pack = n; raw = u; break; } }
    const R = raw != null ? halfUp(raw) : null;
    let price, rule;
    if (g == null && R == null) { price = null; rule = 'нет цены ни у GRN, ни в прайсе'; }
    else if (g == null) { price = R; rule = 'у GRN нет цены — РРЦ'; }
    else if (R == null) { price = g; rule = 'GRN (нет в прайсе)'; }
    else if (g >= Math.floor(raw)) { price = g; rule = g > Math.ceil(raw) ? 'GRN (выше РРЦ)' : 'GRN (= РРЦ / округление)'; }
    else { price = R; rule = 'РРЦ: GRN ниже на ' + (R - g) + ' грн'; }
    out[r.article] = { grn: g, rrp_raw: raw, rrp: R, pack, price, rule };
    const k = rule.startsWith('РРЦ: GRN ниже') ? 'РРЦ вместо GRN' : rule; cnt[k] = (cnt[k] || 0) + 1;
  }
  fs.writeFileSync(__dirname + '/price.json', JSON.stringify(out, null, 1)); console.log(cnt);
  for (const [a, v] of Object.entries(out)) if (v.rule.startsWith('РРЦ: GRN')) console.log(a, 'GRN', v.grn, 'РРЦ', v.rrp, v.pack > 1 ? '(за шт из ' + v.pack + ')' : '');
})();
