// «Профіль і розмір» (owner 19.10.2026, PREVIEW ONLY): the characteristic «Розмір наконечника» (rozmir_nakonechnyka, param 6600, dictionary 392)
// gets values «profile + size» («PH 2», «TX 20», «SL 1,0×5,5», «HEX 5,0», «Квадрат #2») instead of a bare size. Read-only: builds the new values
// of every product that carries the characteristic (groups Викрутки 1098, Kraftform Kompakt 1057, динамометрія 1195 — one shared dictionary).
//   node cat/pr_size.js <live.json>   (live.json: lib/full_export.js with article,title,parent,alt_parent,display_in_showcase,characteristics,link)
// Sources, in this order: single tool — its own profile + size, checked against the first line of its WERA datasheet (batch/ds/<a>.txt; the
// datasheet wins); slot thickness — WERA series table (cat/1098_items.json) or the datasheet. Sets — the WERA composition (cat/sets_comp.json,
// expanded by comp_expand.js): each component's composition text («PH 2 x 100 мм», «1 мм x 5.5 мм x 100 мм») or its own catalog profile + size.
// TX BO → «TX n» (a TX BO blade fits TX screws; «з отвором» goes to «Особливості викрутки», owner's item 6).
const fs = require('fs'), path = require('path'); const { cmp } = require('../lib/valsort.js'); const { expand, hasComp } = require('./comp_expand.js');
// profile dictionary value -> [short UA, short RU, order]; full format = dictionary value (UA/RU) + size
const PR = { 'PH (Phillips)': ['PH', 'PH', 1], 'PZ (Pozidriv)': ['PZ', 'PZ', 2], 'PlusMinus (PH/PZ + шліц)': ['PlusMinus', 'PlusMinus', 3], 'TX (TORX®)': ['TX', 'TX', 4],
  'TX BO (TORX® з отвором)': ['TX', 'TX', 4], 'IP (TORX PLUS®)': ['IP', 'IP', 5], 'IPR (TORX PLUS® IPR)': ['IPR', 'IPR', 6], 'SL (шліц)': ['SL', 'SL', 7], 'HEX (шестигранник)': ['HEX', 'HEX', 8],
  'HEX BO (шестигранник з отвором)': ['HEX BO', 'HEX BO', 9], 'Квадрат (Robertson)': ['Квадрат', 'Квадрат', 10], 'Торцева головка (зовнішній шестигранник)': ['Торцева', 'Торцевая', 11],
  'TRI-WING®': ['TRI-WING®', 'TRI-WING®', 12], 'TORQ-SET® Mplus': ['TORQ-SET®', 'TORQ-SET®', 13], 'Spanner (натяжні гвинти)': ['Spanner', 'Spanner', 14], 'Microstix®': ['Microstix®', 'Microstix®', 15],
  'Pentalobe': ['Pentalobe', 'Pentalobe', 16] };
const TXBO = 'TX BO (TORX® з отвором)', TX = 'TX (TORX®)'; const CANON = { [TXBO]: TX, 'HEX BO (шестигранник з отвором)': 'HEX (шестигранник)' };
const I98 = Object.fromEntries(require('./1098_items.json').map(i => [i.a, i]));
// first line of the datasheet (the product name with its size); a wrapped tail («p1 мм») is joined back
const dsLine = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); if (!fs.existsSync(f)) return ''; const l = fs.readFileSync(f, 'utf8').split('\n').map(x => x.replace(/^p\d+ /, ''));
  let s = l[0]; for (let i = 1; i < 3 && l[i] && !/EAN:|№/.test(l[i]); i++) s += ' ' + l[i]; return s.trim(); };
const d1 = x => { let s = String(x).trim().replace('.', ','); if (!/,/.test(s)) s += ',0'; return s.replace(/(,\d)0+$/, '$1'); };   // 1 -> 1,0 ; 0.80 -> 0,8 ; 0.18 -> 0,18
const inch = x => String(x).replace(/["“”″]+/g, '').trim() + '″';
// a size value as stored today -> the size part of the new value
function sizePart(prof, s) { s = String(s).replace(/ /g, '').trim();
  if (prof === 'Квадрат (Robertson)') return '#' + (s === '01' ? '1' : s === '02' ? '2' : s);
  if (prof === 'Торцева головка (зовнішній шестигранник)') return s;
  return s; }
// pairs from a WERA text («PH 2 x 100 мм», «1 мм x 5.5 мм x 100 мм», «3 mm x 25 мм» under a hex head, «# 1 x 25 мм», «TX 6 BO x 60 мм», «PL 1.4 x 40 мм»)
function fromWera(head, z, hint) { z = String(z).replace(/\s+/g, ' ').trim(); let m; const out = [];
  const PP = x => x === 'PH' ? 'PH (Phillips)' : 'PZ (Pozidriv)';
  if ((m = z.match(/^(PH|PZ) ?(\d+) x (PH|PZ) ?(\d+) x/))) return [[PP(m[1]), m[2]], [PP(m[3]), m[4]]];   // combination ends 83/85/86 «PH 1 x PZ 1 x 175 мм»
  if ((m = z.match(/^(PH|PZ) ?(\d+) x (\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x \d/))) return [[PP(m[1]), m[2]], ['SL (шліц)', `${d1(m[3])}×${d1(m[4])}`]];   // 82 «PH 1 x 0.6 мм x 4 мм x 175 мм»
  if ((m = z.match(/^(\d+(?:[.,]\d+)?) mm x (\d+(?:[.,]\d+)?) x \d+(?:[.,]\d+)? мм$/)) && /Комбинированный/i.test(head)) return [['HEX (шестигранник)', d1(m[1])], ['HEX (шестигранник)', d1(m[2])]];   // 84 «4 mm x 5 x 175 мм»
  if ((m = z.match(/^# ?(\d) x \d/)) && /\b(PZ|PH)\/S\b/.test(head)) return [['PlusMinus (PH/PZ + шліц)', head.match(/\b(PZ|PH)\/S\b/)[1] + '/S ' + m[1]]];   // PlusMinus «PZ/S # 1»
  if ((m = z.match(/^(\d+(?:[.,]\d+)?) мм x \d+(?:[.,]\d+)? мм$/)) && (/Г-образн|^\d*950|^3950/i.test(head) || hint === 'HEX (шестигранник)')) return [['HEX (шестигранник)', d1(m[1])]];   // L-keys «1.5 мм x 90 мм»
  if ((m = z.match(/^TX ?(\d+) x TX ?(\d+) x/))) return [[TX, m[1]], [TX, m[2]]];
  if ((m = z.match(/^# ?(\d) x # ?(\d) x/))) return [['Квадрат (Robertson)', '#' + m[1]], ['Квадрат (Robertson)', '#' + m[2]]];   // 68 «# 1 x # 2 x 175 мм»
  if ((m = z.match(/^(PH|PZ) ?(0{0,3}|\d+) x \d/))) return [[m[1] === 'PH' ? 'PH (Phillips)' : 'PZ (Pozidriv)', m[2]]];
  if ((m = z.match(/^TX ?(\d+)( BO)? x \d/))) return [[m[2] || /\bBO\b|отверст/i.test(head) ? TXBO : TX, m[1]]];
  if ((m = z.match(/^(\d+) IP x \d/))) return [['IP (TORX PLUS®)', m[1]]];
  if ((m = z.match(/^(\d+) IPR x \d/))) return [['IPR (TORX PLUS® IPR)', m[1]]];
  // «# 1» is a Robertson square unless the component is a PlusMinus or a Phillips one («1550 PH S … # 1 x 40 мм» is PH 1 in the catalog)
  if ((m = z.match(/^# ?(\d) x \d/))) return hint === 'PH (Phillips)' || hint === 'PZ (Pozidriv)' ? [[hint, m[1]]] : hint === 'PlusMinus (PH/PZ + шліц)' ? [[hint, (/PH/.test(head) ? 'PH' : 'PZ') + '/S ' + m[1]]] : [['Квадрат (Robertson)', '#' + m[1]]];
  if ((m = z.match(/^PL (\d+(?:[.,]\d+)?) x \d/))) return [['Pentalobe', d1(m[1])]];
  if ((m = z.match(/^(m|F|0{1,2}|\d) x \d+ мм$/)) && /Microstix/i.test(head)) return [['Microstix®', m[1]]];
  if ((m = z.match(/^(\d) x \d+ мм$/)) && /TRI-WING/i.test(head)) return [['TRI-WING®', m[1]]];
  if ((m = z.match(/^(\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x \d+/))) return [['SL (шліц)', `${d1(m[1])}×${d1(m[2])}`], ['SL (шліц)', `${d1(m[3])}×${d1(m[4])}`]];  // 81 Ni slot combination end
  if ((m = z.match(/^(\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x \d+(?:[.,]\d+)? мм$/)) && +m[1].replace(',', '.') <= 2.5 && +m[2].replace(',', '.') <= 20 && !/футляр|сумк|чехол|витрин|держател|тестер|индикатор/i.test(head))
    return [['SL (шліц)', `${d1(m[1])}×${d1(m[2])}`]];
  if (hint && !/HEX|Торцева/.test(hint)) return out;   // TORQ-SET, Spanner, TRI-WING… with a bare number: the component's own catalog size
  const HX = hint === 'HEX BO (шестигранник з отвором)' || /Hex-Plus BO/i.test(head) ? 'HEX BO (шестигранник з отвором)' : 'HEX (шестигранник)';
  const hex = /^840|^3840|^950|^354|^352|^2054|^2052|^1013|шестигран|hex/i.test(head) && !/головк|nut|гайк|торцов/i.test(head) || hint === 'HEX (шестигранник)';
  const nut = /^395|^2069|^1069|^1569|^1069|торцов|гайк|наружн|внешн|nut/i.test(head) || hint === 'Торцева головка (зовнішній шестигранник)';
  if ((m = z.match(/^(\d+(?:[.,]\d+)?) mm x \d/))) { if (nut && !hex) return [['Торцева головка (зовнішній шестигранник)', String(m[1]).replace('.', ',') + ' мм']]; if (hex || HX !== 'HEX (шестигранник)') return [[HX, d1(m[1])]]; }
  if ((m = z.match(/^(\d+\/\d+)" x \d/))) { if (nut && !hex) return [['Торцева головка (зовнішній шестигранник)', inch(m[1])]]; if (hex) return [['HEX (шестигранник)', inch(m[1])]]; }
  if ((m = z.match(/^(\d+(?:[.,]\d+)?(?:; \d+(?:[.,]\d+)?)+) mm x TX (\d+) x/))) return [...m[1].split('; ').map(x => ['HEX (шестигранник)', d1(x)]), [TX, m[2]]];   // 9507 «4-in-1»
  if ((m = z.match(/^(\d+(?:[.,]\d+)?(?:; \d+(?:[.,]\d+)?)+) mm x \d/))) return m[1].split('; ').map(x => ['HEX (шестигранник)', d1(x)]);
  return out; }
// slot thickness of a single blade: WERA series table, else the datasheet line «…, 1.2 мм x 6.5 мм x 125 мм»
function slot(a, width) { const r = (I98[a] || {}).row || {}; const t = r['Товщина робочого кінця мм'], w = r['Ширина робочого кінця мм'];
  if (t && t !== '-' && w && w !== '-') return { v: `${d1(t)}×${d1(w)}`, src: 'таблиця серії WERA' };
  const m = dsLine(a).match(/(\d+(?:[.,]\d+)?) мм x (\d+(?:[.,]\d+)?) мм x \d+(?:[.,]\d+)? мм/); if (m) return { v: `${d1(m[1])}×${d1(m[2])}`, src: 'datasheet WERA' };
  const t2 = ((I98[a] || {}).title || '').match(/(\d+,\d+)x(\d+,\d+)x\d+ мм/); if (t2) return { v: `${d1(t2[1])}×${d1(t2[2])}`, src: 'назва товару' };
  return null; }
// PlusMinus: the WERA designation already names the profile («PZ/S 1») — short value is the designation alone
const fmt = (prof, sz, lang, full, RU) => full ? `${lang === 'ru' ? (RU[prof] || prof) : prof} ${sz}` : PR[prof][0] === 'PlusMinus' ? sz : `${PR[prof][lang === 'ru' ? 1 : 0]} ${sz}`;
const key = (prof, sz) => `${PR[prof][2]}|${sz}`;
function build(L) {
  const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
  const RU = {}; for (const p of L) for (const x of ((p.characteristics || {}).profil || [])) if (x.value.ua && x.value.ru) RU[x.value.ua] = x.value.ru;
  const byA = Object.fromEntries(L.map(p => [p.article, p])); const M = require('./member_vals.json');
  const sizesOf = vals => [...(vals.rozmir_nakonechnyka || []), ...(vals.rozmir || []), ...(vals.rozmir_robochoho_kintsia || [])].map(s => String(s).replace(/ /g, '').trim());
  // pairs of a set from its WERA composition, nested sets opened; profiles as the components carry them (TX BO stays TX BO here)
  const cp = a => { const pairs = [], unk = [];
    for (const x of expand(a).filter(x => !x.nonProduct && !x.set)) { const lp = x.art && byA[x.art] ? v(byA[x.art], 'profil').filter(y => PR[y]) : (((M[x.art] || {}).vals || x.vals || {}).profil || []).filter(y => PR[y]);
      let w = x.art && WERA_DE[x.art] ? WERA_DE[x.art].pairs.slice() : fromWera(x.head, x.size, lp.length === 1 ? lp[0] : null);   // nested set without sizes in its datasheet: wera.de
      if (!w.length && lp.length === 1) { const lv = x.art && byA[x.art] ? { rozmir_nakonechnyka: v(byA[x.art], 'rozmir_nakonechnyka'), rozmir: v(byA[x.art], 'rozmir'), rozmir_robochoho_kintsia: v(byA[x.art], 'rozmir_robochoho_kintsia') } : x.vals;
        const ss = [...new Set(sizesOf(lv))]; if (lp[0] === 'SL (шліц)') { for (const s of ss) { const sl = x.art && slot(x.art, s); if (sl) w.push([lp[0], sl.v]); else unk.push(`${x.art || ''} ${x.size} (SL без товщини)`); } }
        else w = ss.map(s => [lp[0], sizePart(lp[0], s)]); }
      if (!w.length && (lp.length || (/\b(PH|PZ|TX|IP|IPR)\b/.test(x.size) || /шлиц|шестигран|квадрат|TORX|Phillips|Pozidriv/i.test(x.head)) && !/держател|ручк|удлинит|адаптер|переходник|динамометрическ|присоедин|футляр|сумк/i.test(x.head)))
        unk.push(`${x.art || ''} ${x.head.slice(0, 45)} ${x.size}`.trim());
      pairs.push(...w); }
    return { pairs, unk }; };
  const rows = [];
  for (const p of L) { const old = v(p, 'rozmir_nakonechnyka'); if (!old.length) continue;
    const prof = v(p, 'profil'), scr = prof.filter(x => PR[x]); const r = { a: p.article, title: p.title.ua, p, profOld: prof, sizeOld: old.map(s => s.replace(/ /g, '')), pairs: [], src: '', status: 'ok', note: [] };
    const single = scr.length === 1 || (scr.length === 2 && scr.includes(TX) && scr.includes(TXBO) && !hasComp(p.article));
    if (single && !hasComp(p.article)) { const pr = scr.includes(TXBO) ? TXBO : scr[0]; r.src = 'профіль + розмір товару';
      for (const s of r.sizeOld) { if (pr === 'SL (шліц)') { const sl = slot(p.article, s); if (!sl) { r.status = 'спірний'; r.note.push(`SL ${s}: товщини немає в таблиці серії і datasheet`); continue; }
          if (sl.v.split('×')[1] !== d1(s)) r.note.push(`ширина на сайті ${s}, у WERA ${sl.v.split('×')[1]}`); r.pairs.push([pr, sl.v]); r.src = 'профіль товару + ' + sl.src; }
        else r.pairs.push([pr, sizePart(pr, s)]); }
      // datasheet check of single tools (the datasheet wins)
      const ds = dsLine(p.article); if (ds) { const z = ds.replace(/^.*?, (?=(?:PH|PZ|TX|PL|#|\d|m |F ))/, ''); const w = fromWera(ds, z, pr);
        if (w.length === 1 && r.pairs.length === 1 && PR[w[0][0]] && PR[w[0][0]][0] === PR[pr][0] && w[0][1] !== r.pairs[0][1] && pr !== 'SL (шліц)') { r.note.push(`на сайті «${fmt(pr, r.pairs[0][1], 'ua', 0, RU)}», у datasheet WERA «${fmt(pr, w[0][1], 'ua', 0, RU)}» — беру datasheet`); r.pairs = [[pr, w[0][1]]]; r.src += ', виправлено за datasheet'; }
        else if (w.length > 1 && w.every(q => PR[q[0]] && PR[q[0]][0] === PR[pr][0])) { r.pairs = w; r.note = []; r.src = 'datasheet WERA (комбінований робочий кінець)'; } } }
    else if (hasComp(p.article)) { r.src = 'склад з datasheet WERA'; const c = cp(p.article); r.pairs.push(...c.pairs); const unk = c.unk;
      const c0 = x => PR[CANON[x] || x][0]; const got = new Set(r.pairs.map(q => c0(q[0]))); const miss = scr.filter(x => !got.has(c0(x)) && !((PROFIL_FIX[p.article] || {}).remove || []).includes(x)); if (miss.length) { r.status = 'частково'; r.note.push('профілю немає в парах зі складу: ' + miss.join(', ')); }
      if (unk.length) { r.note.push(`компоненти без пари профіль+розмір (${unk.length}): ${unk.slice(0, 5).join('; ')}`); if (!r.pairs.length) r.status = 'спірний'; else if (r.status === 'ok') r.status = 'частково'; } }
    else if (!scr.length) { r.status = 'спірний'; r.note.push('профілю немає — пару не скласти'); }
    else { const ds = dsLine(p.article), z = ds.replace(/^.*?, (?=(?:PH|PZ|TX|#|\d))/, ''); const w = ds ? fromWera(ds, z) : [];
      if (w.length && scr.every(x => w.some(q => PR[q[0]][0] === PR[x][0]))) { r.pairs = w; r.src = 'datasheet WERA (комбінований робочий кінець)'; }
      else { r.status = 'спірний'; r.note.push(`${scr.length} профілі, складу з datasheet немає — пари не скласти`); r.src = '—'; r.peer = true; } }
    r.pairs = r.pairs.map(([q, s]) => [CANON[q] || q, s]);   // a BO blade fits the plain screw: «TX 20», «HEX 3,0» (owner's item 6)
    const seen = new Set(); r.pairs = r.pairs.filter(q => PR[q[0]] && q[1] !== undefined && !seen.has(key(...q)) && seen.add(key(...q)));
    r.pairs.sort((x, y) => PR[x[0]][2] - PR[y[0]][2] || pcmp(x[0], x[1], y[1]));
    r.short = r.pairs.map(q => fmt(q[0], q[1], 'ua', 0, RU)); r.shortRu = r.pairs.map(q => fmt(q[0], q[1], 'ru', 0, RU));
    r.full = r.pairs.map(q => fmt(q[0], q[1], 'ua', 1, RU)); r.fullRu = r.pairs.map(q => fmt(q[0], q[1], 'ru', 1, RU));
    if (EMPTY392.includes(r.a)) { r.pairs = r.short = r.shortRu = r.full = r.fullRu = []; r.status = 'ok'; r.note = ['порожньо за рішенням власника 19.10.2026']; r.src = '—'; }
    rows.push(r); }
  // not a tool (handle, holder, extension) in a tool section: CLAUDE.md gives it all values of its section — here the section's pairs that match
  // the profiles and sizes it carries today
  const secOf = p => [p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number);
  for (const r of rows.filter(r => r.peer && !/^Набір/.test(v(r.p, 'vyd_instrumentu').join()))) { const mine = secOf(r.p);
    const peers = rows.filter(q => q !== r && !q.peer && secOf(q.p).some(s => mine.includes(s)));
    const sz = new Set(r.sizeOld.map(s => s.replace(/^0(\d)$/, '$1'))); const pr = new Set(r.profOld.filter(x => PR[x]).map(x => PR[x][0])); const seen = new Set();
    r.pairs = peers.flatMap(q => q.pairs).filter(q => pr.has(PR[q[0]][0]) && (sz.has(q[1].replace(/^#/, '')) || sz.has(q[1].split('×')[1]) || sz.has(q[1].replace(/^(PZ|PH)\/S /, ''))) && !seen.has(key(...q)) && seen.add(key(...q)));
    if (r.pairs.length) { r.status = 'ok'; r.src = 'не інструмент: значення розділу (як зараз)'; r.note = []; r.pairs.sort((x, y) => PR[x[0]][2] - PR[y[0]][2] || pcmp(x[0], x[1], y[1]));
      r.short = r.pairs.map(q => fmt(q[0], q[1], 'ua', 0, RU)); r.shortRu = r.pairs.map(q => fmt(q[0], q[1], 'ru', 0, RU)); r.full = r.pairs.map(q => fmt(q[0], q[1], 'ua', 1, RU)); r.fullRu = r.pairs.map(q => fmt(q[0], q[1], 'ru', 1, RU)); } }
  // coverage: which of today's sizes have no pair, which pairs bring a size that is not there today
  for (const r of rows) { const now = new Set(r.sizeOld.map(normSize)); const got = new Set(r.pairs.map(q => normSize(q[1])));
    r.lost = [...now].filter(s => !got.has(s)); r.gained = [...new Set(r.pairs.filter(q => !now.has(normSize(q[1]))).map(q => fmt(q[0], q[1], 'ua', 0, RU)))]; }
  return { rows, RU, cp, v }; }
// Task 2 (owner 19.10.2026, PREVIEW ONLY): «PH у складі» … «PlusMinus у складі» keep their characteristics but get the sizes of that profile from the
// set's WERA composition instead of «Так» — one filter per profile, so PH 1 (one filter) + PZ 2 (another filter) = AND on the storefront.
// Profiles are taken as the components carry them: «TX у складі» = TX components, «TX BO у складі» = TX BO components («TX BO 20»), as «Так» is counted today.
const SK = [['sklad_ph', 'PH (Phillips)'], ['sklad_pz', 'PZ (Pozidriv)'], ['sklad_tx', TX], ['sklad_sl', 'SL (шліц)'], ['sklad_hex', 'HEX (шестигранник)'], ['sklad_kvadrat', 'Квадрат (Robertson)'],
  ['sklad_tx_bo', TXBO], ['sklad_plusminus', 'PlusMinus (PH/PZ + шліц)']];
const SKT = { sklad_ph: 'PH у складі', sklad_pz: 'PZ у складі', sklad_tx: 'TX у складі', sklad_sl: 'SL у складі', sklad_hex: 'HEX у складі', sklad_kvadrat: 'Квадрат у складі', sklad_tx_bo: 'TX BO у складі', sklad_plusminus: 'PlusMinus у складі' };
// a BO bit drives the plain screw too: its size also counts in «TX у складі» / «HEX у складі» (as «TX 20»), and in «TX BO у складі» (as «TX BO 20»)
const SKIN = { sklad_tx: [TX, TXBO], sklad_hex: ['HEX (шестигранник)', 'HEX BO (шестигранник з отвором)'] };
const skFmt = (prof, sz) => prof === TXBO ? `TX BO ${sz}` : fmt(prof, sz, 'ua', 0, {});
// sets_fix.js sets: composition only in prose / rows without an article — sizes quoted from the WERA datasheet in sets_fix.js
const FIX_SIZES = { '05004186001': [['PH (Phillips)', '1'], [TX, '10'], [TX, '25'], ...['2,5', '3,0', '4,0', '5,0'].map(s => ['HEX (шестигранник)', s])],
  '05004182001': [...['2,5', '3,0', '4,0', '5,0', '6,0'].map(s => ['HEX (шестигранник)', s]), [TX, '25']],
  // Bicycle Set 8: rows not in the catalog — 8767 B TX 25, TX 30 x 107 mm; 8740 B (hex) 4, 5, 6 x 107 mm, 8, 10 x 100 mm
  '05004176001': [...['4,0', '5,0', '6,0', '8,0', '10,0'].map(s => ['HEX (шестигранник)', s]), [TX, '25'], [TX, '30']] };
// owner 19.10.2026: sets whose datasheet has no sizes — the composition from the set's page on wera.de («Werkzeuge in diesem Set»), fetched 19.10.2026
const HX = 'HEX (шестигранник)'; const hexMM = ['1,5', '2,0', '2,5', '3,0', '4,0', '5,0', '6,0', '8,0', '10,0'].map(s => [HX, s]); const txL = ['8', '9', '10', '15', '20', '25', '27', '30', '40'].map(s => [TX, s]);
const WERA_DE = {
  '05022699001': { url: 'https://www.wera.de/de/werkzeuge/3950-9-hex-plus-multicolour-hf-stainless-1-winkelschluesselsatz-metrisch-edelstahl-mit-haltefunktion', pairs: hexMM },
  '05022860001': { url: 'https://www.wera.de/de/werkzeuge/3950-9-hex-plus-multicolour-imperial-stainless-1-winkelschluesselsatz-zoellig-edelstahl', pairs: ['5/64″', '3/32″', '1/8″', '5/32″', '3/16″', '7/32″', '1/4″', '5/16″', '3/8″'].map(s => [HX, s]) },
  '05022210001': { url: 'https://www.wera.de/de/werkzeuge/950-9-hex-plus-multicolour-hf-1-winkelschluesselsatz-metrisch-blacklaser-mit-haltefunktion', pairs: hexMM },
  '05022089001': { url: 'https://www.wera.de/de/werkzeuge/950-9-hex-plus-multicolour-1-winkelschluesselsatz-metrisch-blacklaser', pairs: hexMM },
  '05022689001': { url: 'https://www.wera.de/de/werkzeuge/3967-9-tx-sxl-multicolour-hf-stainless-1-winkelschluesselsatz-mit-haltefunktion-edelstahl', pairs: txL },
  // 9740 foam inlay: 950/9 Hex-Plus Multicolour 1 (05022089001) + 967/9 TX XL Multicolour 1 (05024480001: TX 8…40 on its own wera.de page)
  '05150140001': { url: 'https://www.wera.de/de/werkzeuge/9740-schaumstoffeinlage-winkelschluessel-set-1 + https://www.wera.de/de/05024480001', pairs: [...hexMM, ...txL] } };
// owner 19.10.2026: profile corrections from the WERA composition
const PROFIL_FIX = {
  '05006631001': { remove: ['Квадрат (Robertson)'], add: ['PlusMinus (PH/PZ + шліц)'], why: 'у складі WERA «Kraftform Kompakt VDE 3065 iS PZ/S # 1, # 2» — PlusMinus, не квадрат' },
  '05135961001': { remove: ['Квадрат (Robertson)'], add: ['PlusMinus (PH/PZ + шліц)'], why: 'у складі WERA «165 iSS PZ/S # 1, # 2» — PlusMinus, не квадрат' },
  '05059299001': { remove: ['SL (шліц)'], add: [], why: 'datasheet WERA с. 4 «Содержимое» і wera.de: 816 R, PH 1–3, PZ 1–3, TX BO 15–30, липучки — шліцевих біт немає' },
  '05150140001': { remove: [], add: [TX], why: 'у складі WERA 967/9 TX XL Multicolour 1 (TX 8…40)' } };
const NOSIZE_RU = ' (размер не указан)';
const NOSIZE = prof => `${{ [TX]: 'TX', [TXBO]: 'TX BO', 'PlusMinus (PH/PZ + шліц)': 'PlusMinus' }[prof] || PR[prof][0]} (розмір не вказано)`;
// owner 19.10.2026: 05133126001 — «Профіль і розмір» stays empty (no slot thickness anywhere)
// owner 21.10.2026: accessories get no sizes — removers 1429 / 1529 ESD, handle 1014 (its bit values in «Мікробіти 4 мм Micro» stay)
const EMPTY392 = ['05133126001', '05027456001', '05027450001', '05051278001'];
Object.assign(module.exports, { WERA_DE, PROFIL_FIX, NOSIZE, NOSIZE_RU, EMPTY392 });
function buildSklad(L, ctx) { const { cp, v } = ctx; const items = require('./g_sklad.js').items; const byA = Object.fromEntries(L.map(p => [p.article, p])); const out = [];
  for (const it of items) { const p = byA[it.a]; if (!p) continue; const c = hasComp(it.a) ? cp(it.a) : { pairs: [], unk: [] }; const pairs = [...c.pairs, ...(FIX_SIZES[it.a] || []), ...((WERA_DE[it.a] || {}).pairs || [])];
    // no composition sizes: a one-profile set takes the sizes its group already wrote from WERA (L-key sets: «Розмір ключа»)
    if (!pairs.length) { const pr = [...new Set(v(p, 'profil').filter(x => PR[x]).map(x => CANON[x] || x))]; const own = ['rozmir_kliucha', 'rozmir_nakonechnyka', 'rozmir', 'rozmir_robochoho_kintsia'].flatMap(k => v(p, k));
      if (pr.length === 1 && own.length) { const raw = pr[0] === TX && v(p, 'profil').includes(TXBO) && /\bBO\b/.test(p.title.ua) ? TXBO : pr[0]; pairs.push(...own.map(s => [raw, sizePart(raw, s.replace(/ /g, '').replace(/ мм$/, ''))])); } }
    const r = { a: it.a, title: p.title.ua, p, vis: +p.display_in_showcase, secs: [p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number), now: {}, next: {}, status: {}, unk: c.unk };
    for (const [k, prof] of SK) { r.now[k] = v(p, k); const seen = new Set(); const take = SKIN[k] || [prof];
      r.next[k] = pairs.filter(q => take.includes(q[0]) && !seen.has(q[1]) && seen.add(q[1])).sort((x, y) => pcmp(prof, x[1], y[1])).map(q => skFmt(prof, q[1]));
      if (((PROFIL_FIX[it.a] || {}).remove || []).includes(prof)) { r.next[k] = []; r.status[k] = r.now[k].length ? 'профіль прибрано (немає у складі WERA)' : ''; continue; }
      r.status[k] = r.now[k].length && r.next[k].length ? 'ok' : r.now[k].length ? 'розміру немає' : r.next[k].length ? 'новий профіль зі складу' : '';
      // owner 19.10.2026: profile in the set, sizes neither in the datasheet nor on wera.de -> «PH (розмір не вказано)», last in the list, set in disputed
      if (r.status[k] === 'розміру немає') { r.next[k] = [NOSIZE(prof)]; r.status[k] = 'розмір не вказано'; } }
    if (WERA_DE[it.a]) r.src = WERA_DE[it.a].url;
    out.push(r); }
  return out; }
module.exports.buildSklad = buildSklad; module.exports.SK = SK; module.exports.SKT = SKT;
// a size reduced to compare old and new values: «0 », «#0», «0» -> 0; «01» -> 1; SL «1,0×5,5» -> its width 5,5; «PZ/S 1» -> 1; «5 мм» stays (nut)
const normSize = s => { s = String(s).replace(/ /g, '').trim().replace(/^#/, '').replace(/^(PZ|PH)\/S /, ''); if (/×/.test(s)) s = s.split('×')[1]; return s.replace(/^0(\d)$/, '$1'); };
// size order inside a profile: 000 < 00 < 0 < 1 …; SL by width, then thickness; HEX mm before inch; Microstix as WERA lists them in its compositions (m, 00, F, 0, 1)
const MS = ['m', '00', 'F', '0', '1'];
function pcmp(prof, a, b) { if (prof === 'SL (шліц)') { const [ta, wa] = a.split('×').map(x => parseFloat(x.replace(',', '.'))), [tb, wb] = b.split('×').map(x => parseFloat(x.replace(',', '.'))); return wa - wb || ta - tb; }
  if (prof === 'Microstix®') return MS.indexOf(a) - MS.indexOf(b); return cmp(a.replace(/^#/, ''), b.replace(/^#/, '')); }
Object.assign(module.exports, { build, PR, pcmp, fromWera, CANON });
if (require.main === module) { const { rows } = build(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
  const st = {}; for (const r of rows) st[r.status] = (st[r.status] || 0) + 1; console.log('products', rows.length, st);
  console.log('lost sizes on', rows.filter(r => r.lost.length).length, 'gained on', rows.filter(r => r.gained.length).length);
  for (const r of rows.filter(r => r.status !== 'ok' || r.note.length || r.lost.length || r.gained.length).slice(0, 400)) console.log(r.status, r.a, r.title.slice(0, 50), '|', r.short.join(', ').slice(0, 120), '|', r.note.join(' / ').slice(0, 250), r.lost.length ? '| LOST ' + r.lost.join(',') : '', r.gained.length ? '| GAINED ' + r.gained.join(',') : ''); }
// For the group generators (cat/g_vykrutky, g_kk, g_dyn, g_sklad): what is written on the site (cat/pr_size_values.json, pr_size_write.js snapshot) is the
// source; a product that is not in it (new product, new set) gets its values computed by the same rules (composition from cat/member_vals.json, no live export).
const SNAP = process.env.PR_SIZE_NOSNAP ? null : (() => { try { return require('./pr_size_values.json'); } catch (e) { return null; } })();   // PR_SIZE_NOSNAP=1: compute everything (self-check)
let STAT = null; const stat = () => STAT || (STAT = build([]));
const short = pairs => { const seen = new Set(); return pairs.map(([q, s]) => [CANON[q] || q, s]).filter(q => PR[q[0]] && !seen.has(key(...q)) && seen.add(key(...q)))
  .sort((x, y) => PR[x[0]][2] - PR[y[0]][2] || pcmp(x[0], x[1], y[1])).map(q => fmt(q[0], q[1], 'ua', 0, {})); };
// «Профіль і розмір» of one product: its profiles (dictionary values) and bare sizes as the generator computed them
function tipValues(a, profiles, sizes) {
  if (SNAP && SNAP.values.rozmir_nakonechnyka[a]) return SNAP.values.rozmir_nakonechnyka[a];
  if (EMPTY392.includes(a) || !sizes.length) return [];
  if (hasComp(a)) return short(stat().cp(a).pairs);
  const pr = [...new Set(profiles.filter(x => PR[x]).map(x => CANON[x] || x))];
  // the first line of the WERA datasheet wins: combination ends («PH 1 x 0.6 мм x 4 мм x 175 мм»), a size the catalog has wrong (Pentalobe «PL 1.4»)
  const ds = dsLine(a), w = ds ? fromWera(ds, ds.replace(/^.*?, (?=(?:PH|PZ|TX|PL|#|\d|m |F ))/, ''), pr.length === 1 ? pr[0] : null) : [];
  if (w.length && w.every(q => pr.includes(CANON[q[0]] || q[0])) && pr.every(x => w.some(q => (CANON[q[0]] || q[0]) === x)) && (w.length > 1 || pr[0] !== 'SL (шліц)')) return short(w);
  if (pr.length !== 1) return [];   // several profiles without a composition or a datasheet pair: not paired
  return short(sizes.map(s => { s = String(s).replace(/ /g, '').trim(); if (pr[0] !== 'SL (шліц)') return [pr[0], sizePart(pr[0], s)]; const sl = slot(a, s); return sl ? [pr[0], sl.v] : null; }).filter(Boolean)); }
// «… у складі» of one set: profiles it has (as g_sklad found them) -> sizes from the composition; a profile without sizes -> «PH (розмір не вказано)»
function skladValues(a, key, has) {
  if (SNAP && SNAP.values[key] && SNAP.values[key][a]) return SNAP.values[key][a];
  const prof = SK.find(x => x[0] === key)[1]; if (((PROFIL_FIX[a] || {}).remove || []).includes(prof)) return [];
  const pairs = [...(hasComp(a) ? stat().cp(a).pairs : []), ...(FIX_SIZES[a] || []), ...((WERA_DE[a] || {}).pairs || [])]; const take = SKIN[key] || [prof]; const seen = new Set();
  const vals = pairs.filter(q => take.includes(q[0]) && !seen.has(q[1]) && seen.add(q[1])).sort((x, y) => pcmp(prof, x[1], y[1])).map(q => skFmt(prof, q[1]));
  return vals.length ? vals : has ? [NOSIZE(prof)] : []; }
Object.assign(module.exports, { tipValues, skladValues, SNAP });
// A non-tool (handle, holder, extension) of a generator section carries the section's values (CLAUDE.md filters rule): the pairs of its section peers
// that match the profiles and sizes it carries. items: [{a, secs, kind, vals:{profil, rozmir_nakonechnyka}}] after tipValues; changes items in place.
function fillPeers(items, sizesOf) { for (const it of items.filter(i => !i.kind && !(i.vals.rozmir_nakonechnyka || []).length && (sizesOf(i) || []).length && !(SNAP && SNAP.values.rozmir_nakonechnyka[i.a]))) {
    const pr = new Set((it.vals.profil || []).filter(x => PR[x]).map(x => PR[CANON[x] || x][0])); const sz = new Set(sizesOf(it).map(s => normSize(s)));
    const peers = items.filter(q => q !== it && q.kind && (q.secs || []).some(s => (it.secs || []).includes(s)));
    it.vals.rozmir_nakonechnyka = [...new Set(peers.flatMap(q => q.vals.rozmir_nakonechnyka || []))].filter(x => { const m = x.match(/^(\S+(?: BO)?) (.+)$/); return m && pr.has(m[1]) && sz.has(normSize(m[2])); }); } }
module.exports.fillPeers = fillPeers;
// Generators: profile corrections from the WERA composition (PROFIL_FIX), and the whole «Профіль і розмір» step of a group with that characteristic
// (bo: the screwdriver group — TX BO -> TX + «З отвором (TX BO)»). Call after sets_fill; changes items in place.
const BOFEAT = 'З отвором (TX BO)';
function fixProfiles(items) { for (const it of items) { const f = PROFIL_FIX[it.a]; if (f && it.vals.profil) it.vals.profil = [...new Set([...it.vals.profil.filter(x => !f.remove.includes(x)), ...f.add])]; } }
function finishGroup(items, { bo } = {}) { fixProfiles(items); const sizes = new Map();
  for (const it of items) { const prof = it.vals.profil || []; sizes.set(it, it.vals.rozmir_nakonechnyka || []);
    if (bo && prof.includes(TXBO)) { it.vals.profil = [...new Set(prof.map(x => x === TXBO ? TX : x))]; it.vals.osoblyvosti_vykrutky = [...new Set([...(it.vals.osoblyvosti_vykrutky || []), BOFEAT])]; }
    it.vals.rozmir_nakonechnyka = tipValues(it.a, prof, sizes.get(it)); }
  fillPeers(items, i => sizes.get(i)); }
Object.assign(module.exports, { fixProfiles, finishGroup, BOFEAT });
