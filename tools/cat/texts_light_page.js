// Example page for rule Б (owner 28.10.2026: light changes): every distinct old -> new sentence pair of a phrase plan with its count, and N products
// before / after (only the changed sentences).   node cat/texts_light_page.js <plan.json> <all.json> <out.html> [art ...]
const fs = require('fs'); const [, , PL, ALL, OUT, ...ex] = process.argv; const P = JSON.parse(fs.readFileSync(PL, 'utf8')).products;
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const sent = h => h.replace(/<table[\s\S]*?<\/table>/g, '').split(/<[^>]+>/).map(x => x.trim()).filter(Boolean).flatMap(x => x.split(/(?<=\.)\s+/));
const pair = (o, n) => { const so = sent(o), sn = sent(n); return [so.filter(x => !sn.includes(x)), sn.filter(x => !so.includes(x))]; };
const cnt = {}; for (const x of Object.values(P)) for (const l of ['ua', 'ru']) { const [o, n] = pair(x.old[l], x.new[l]); for (let i = 0; i < o.length; i++) { const k = l.toUpperCase() + '|' + o[i] + '|' + (n[i] || ''); cnt[k] = (cnt[k] || 0) + 1; } }
const pairs = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [l, o, nw] = k.split('|'); return `<tr><td>${l}</td><td>${esc(o)}</td><td><b>${esc(nw)}</b></td><td>${n}</td></tr>`; }).join('');
const rows = ex.filter(a => P[a]).map(a => { const u = pair(P[a].old.ua, P[a].new.ua), r = pair(P[a].old.ru, P[a].new.ru);
  return `<tr><td>${a}<br><span class="m">${esc(A[a].mod_title.ua)}</span></td><td>UA: ${esc(u[0].join(' '))}<br>RU: ${esc(r[0].join(' ')) || '—'}</td><td><b>UA: ${esc(u[1].join(' '))}<br>RU: ${esc(r[1].join(' ')) || '—'}</b></td></tr>`; }).join('');
const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Тексты — лёгкие правки</title>
<style>body{margin:0;background:#111;color:#ededed;font-family:Roboto,Arial,sans-serif;font-size:14px}.w{max-width:1200px;margin:0 auto;padding:16px}h1{font-size:20px}h2{font-size:17px;margin:28px 0 8px}.m{color:#999;font-size:12px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #363434;padding:6px 8px;vertical-align:top;text-align:left}th{background:#262523}</style></head><body><div class="w">
<h1>Правило Б — лёгкие правки фраз (на сайт НЕ записано)</h1><p class="m">${Object.keys(P).length} описаний «Викруток». Термины WERA (індикатор Take it easy, Lasertip, Hex-Plus, фіксуюча функція) — как есть, меняется порядок / пара слов, смысл и длина те же; остальной текст описания не меняется. Жду «ок».</p>
<h2>Примеры «было / стало»</h2><table><tr><th>Товар</th><th>Было</th><th>Станет</th></tr>${rows}</table>
<h2>Все замены (каждая фраза — сколько описаний)</h2><table><tr><th>Язык</th><th>Было</th><th>Станет</th><th>Описаний</th></tr>${pairs}</table></div></body></html>`;
fs.writeFileSync(OUT, page); console.log(OUT, (page.length / 1024 | 0) + ' KB');
