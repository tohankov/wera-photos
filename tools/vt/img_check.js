// Every picture referenced in the descriptions (UA / RU, <img src>) of a full export: distinct URL -> HTTP status (HEAD, our domain only,
// 0.25 s apart, resumable out file); relative paths (no leading «/», no scheme) are reported as broken by themselves. Read-only.
//   node vt/img_check.js <all export.json> <out.json>   -> { checked: {url: status}, bad: [{url, status, products}] }
const fs = require('fs'); const [, , ALL, OUT] = process.argv; const A = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const S = {}; for (const p of A) for (const l of ['ua', 'ru']) { const h = (p.description || {})[l] || '';
  for (const m of h.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)) (S[m[1]] = S[m[1]] || new Set()).add(p.article); }
const st = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { checked: {} }; const sleep = ms => new Promise(r => setTimeout(r, ms)); const T0 = Date.now();
(async () => { for (const u of Object.keys(S)) { if (u in st.checked) continue; if (Date.now() - T0 > 520000) break;
    if (!/^(https?:)?\/\//.test(u) && !u.startsWith('/')) { st.checked[u] = 'relative'; continue; }
    const full = u.startsWith('/') && !u.startsWith('//') ? 'https://tl-shop.com.ua' + u : u; if (!/tl-shop\.com\.ua/.test(full)) { st.checked[u] = 'foreign'; continue; }
    await sleep(250); try { const r = await fetch(encodeURI(decodeURI(full)), { method: 'HEAD', headers: { 'user-agent': 'Mozilla/5.0' } }); st.checked[u] = r.status; } catch (e) { st.checked[u] = 'error'; }
    fs.writeFileSync(OUT, JSON.stringify(st)); }
  st.bad = Object.entries(st.checked).filter(([u, s]) => s !== 200).map(([url, status]) => ({ url, status, products: [...(S[url] || [])] }));
  fs.writeFileSync(OUT, JSON.stringify(st, null, 1)); console.log('distinct', Object.keys(S).length, 'checked', Object.keys(st.checked).length, 'bad', st.bad.length);
  const c = {}; for (const b of st.bad) c[b.status] = (c[b.status] || 0) + 1; console.log(c); })();
