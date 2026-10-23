// Background removal for the MAIN product photo (owner 23.10.2026, global check item 7; PILOT — nothing is uploaded from here).
// A WERA datasheet / packshot photo sits on a flat white (or light grey) background. The background is flood-filled from the frame border through
// pixels that are close to the background colour, neutral (grey) and smooth (a soft shadow is smooth, the edge of a tool is a sharp step) — so a light
// chrome highlight INSIDE the tool is never reached (it is behind the tool's edge). Enclosed background-like spots are holes only when they are flat
// pure background (a wrench ring, a hanging eye); a blown-out highlight is kept opaque. The edge band gets a soft alpha and its colour is un-blended
// from the background, so there is no white halo on the dark site.
//   cut(inputFile) -> { png: Buffer (RGBA), stats }      node lib/cutout.js <in> <out.png>
const sharp = require('sharp');
const P = { noise: 10, hi: 48, grad: 7, neutral: 14, holePure: 0.92, holeMin: 0.004, band: 2, core: 3, speck: 0.0005, close: 2, bandLen: 40 };
async function cut(file, opt = {}) { const o = { ...P, ...opt };
  const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H, px = i => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  // background colour: median of the frame border
  const bord = []; for (let x = 0; x < W; x++) { bord.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) bord.push(y * W, y * W + W - 1);
  const med = c => { const v = bord.map(i => data[i * 3 + c]).sort((a, b) => a - b); return v[v.length >> 1]; }; const BG = [med(0), med(1), med(2)];
  const d = new Float32Array(N), neu = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const [r, g, b] = px(i); d[i] = Math.max(Math.abs(r - BG[0]), Math.abs(g - BG[1]), Math.abs(b - BG[2])); neu[i] = Math.max(r, g, b) - Math.min(r, g, b) <= o.neutral ? 1 : 0; }
  const grad = i => { const x = i % W, y = (i / W) | 0; let m = 0; for (const j of [x > 0 ? i - 1 : i, x < W - 1 ? i + 1 : i, y > 0 ? i - W : i, y < H - 1 ? i + W : i]) m = Math.max(m, Math.abs(d[i] - d[j])); return m; };
  // flood fill of the background from the border
  const bg = new Uint8Array(N); const q = new Int32Array(N); let qh = 0, qt = 0;
  const ok = i => d[i] <= o.noise || (d[i] <= o.hi && neu[i] && grad(i) <= o.grad);
  for (const i of bord) if (!bg[i] && ok(i)) { bg[i] = 1; q[qt++] = i; }
  while (qh < qt) { const i = q[qh++], x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && ok(j)) { bg[j] = 1; q[qt++] = j; } }
  const nb4 = i => { const x = i % W, y = (i / W) | 0; return [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1].filter(j => j >= 0); };
  // the «soft» part of the fill (d > noise: a shadow) is background only where it is WIDE — a pixel with only background within `core` px;
  // a narrow light sliver along the tool's edge (a chrome rim next to the white) goes back to the tool
  let back = 0; { const loose = i => bg[i] && d[i] > o.noise; const R = o.core; const seen = new Uint8Array(N);
    for (let s = 0; s < N; s++) { if (!loose(s) || seen[s]) continue; const comp = []; seen[s] = 1; const st = [s];
      while (st.length) { const i = st.pop(); comp.push(i); for (const j of nb4(i)) if (!seen[j] && loose(j)) { seen[j] = 1; st.push(j); } }
      const wide = comp.some(i => { const x = i % W, y = (i / W) | 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (!bg[yy * W + xx]) return false; } return true; });
      if (!wide) { for (const i of comp) bg[i] = 0; back += comp.length; } } }
  // light-on-light: a highlight band along the tool's edge is reached by the fill through an open end of the outline. Close the silhouette
  // (dilate + erode by `close` px): a pixel inside the closed silhouette that is not flat pure background (d >= 2) goes back to the tool
  let closed = 0; if (o.close) { const R = o.close; const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = bg[i] ? 0 : 1;
    const pass = (src, dil) => { const t = new Uint8Array(N), u = new Uint8Array(N);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = dil ? 0 : 1; for (let k = -R; k <= R; k++) { const xx = x + k; const s = xx < 0 || xx >= W ? (dil ? 0 : 1) : src[y * W + xx]; v = dil ? (v | s) : (v & s); } t[y * W + x] = v; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = dil ? 0 : 1; for (let k = -R; k <= R; k++) { const yy = y + k; const s = yy < 0 || yy >= H ? (dil ? 0 : 1) : t[yy * W + x]; v = dil ? (v | s) : (v & s); } u[y * W + x] = v; } return u; };
    const c = pass(pass(m, true), false); const fill = new Uint8Array(N); for (let i = 0; i < N; i++) if (c[i] && bg[i] === 1 && d[i] >= 2) fill[i] = 1;
    // only a LONG THIN band is a highlight between two edges (Vario blade); a small blob in a concave edge (socket groove, bit flank) stays background
    const seen = new Uint8Array(N); for (let s = 0; s < N; s++) { if (!fill[s] || seen[s]) continue; const comp = []; seen[s] = 1; const st = [s];
      while (st.length) { const i = st.pop(); comp.push(i); const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (fill[j] && !seen[j]) { seen[j] = 1; st.push(j); } } }
      let x0 = W, x1 = 0, y0 = H, y1 = 0; for (const i of comp) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const len = Math.max(x1 - x0, y1 - y0) + 1; if (len >= o.bandLen && comp.length / len <= 2 * o.close) { for (const i of comp) bg[i] = 0; closed += comp.length; } } }
  // specks and thin loose lines left of the shadow / JPEG noise: a small or thin object part not touching the biggest part -> background
  let specks = 0; { const lab = new Int32Array(N); const comps = []; for (let s = 0; s < N; s++) { if (bg[s] || lab[s]) continue; const c = []; lab[s] = comps.length + 1; const st = [s];
      while (st.length) { const i = st.pop(); c.push(i); for (const j of nb4(i)) if (!bg[j] && !lab[j]) { lab[j] = comps.length + 1; st.push(j); } } comps.push(c); }
    const big = Math.max(0, ...comps.map(c => c.length));
    for (const c of comps) { if (c.length === big) continue; let x0 = W, x1 = 0, y0 = H, y1 = 0; for (const i of c) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const thin = c.length / (Math.max(x1 - x0, y1 - y0) + 1) < 2.5; if (c.length < o.speck * N || (thin && c.length < 0.01 * N)) { for (const i of c) bg[i] = 1; specks++; } } }
  // enclosed background-like spots: a hole only when flat pure background
  const lab = new Int32Array(N); let holes = 0, kept = 0;
  for (let s = 0; s < N; s++) { if (bg[s] || lab[s] || d[s] > o.noise) continue; const comp = []; lab[s] = -1; const st = [s];
    while (st.length) { const i = st.pop(); comp.push(i); const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && !lab[j] && d[j] <= o.noise) { lab[j] = -1; st.push(j); } }
    const pure = comp.filter(i => d[i] <= 3).length / comp.length;
    if (comp.length >= o.holeMin * N && pure >= o.holePure) { for (const i of comp) bg[i] = 2; holes++; } else kept++; }
  // distance (in px, up to band+1) from the background, for the soft edge
  const dist = new Uint8Array(N).fill(255); let fr = []; for (let i = 0; i < N; i++) if (bg[i]) { dist[i] = 0; fr.push(i); }
  for (let k = 1; k <= o.band + 1; k++) { const nx = []; for (const i of fr) { const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && dist[j] === 255) { dist[j] = k; nx.push(j); } } fr = nx; }
  // inner reference: the object's own distance from the background a little further in (light chrome -> small reference -> stays opaque)
  const out = Buffer.alloc(N * 4); let semi = 0;
  for (let i = 0; i < N; i++) { const [r, g, b] = px(i); let a = 1;
    if (bg[i]) a = 0;
    else if (dist[i] <= o.band) { const x = i % W, y = (i / W) | 0; let ref = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (dist[j] > o.band) ref = Math.max(ref, d[j]); }
      a = ref > 0 ? Math.min(1, d[i] / Math.max(ref, 24)) : Math.min(1, d[i] / 48); if (a < 1) semi++; }
    let cr = r, cg = g, cb = b; if (a > 0 && a < 1) { cr = (r - (1 - a) * BG[0]) / a; cg = (g - (1 - a) * BG[1]) / a; cb = (b - (1 - a) * BG[2]) / a; }
    out[i * 4] = Math.max(0, Math.min(255, Math.round(cr))); out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(cg))); out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(cb))); out[i * 4 + 3] = Math.round(a * 255); }
  const fg = N - [...bg].filter(Boolean).length;
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  return { png, stats: { W, H, bg: BG, fgShare: +(fg / N).toFixed(3), holes, keptLight: kept, edge: semi, rimBack: back, closed, specks } }; }
module.exports = { cut, P };
if (require.main === module) cut(process.argv[2]).then(r => { require('fs').writeFileSync(process.argv[3], r.png); console.log(JSON.stringify(r.stats)); });
