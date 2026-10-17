// Title format rules (UA and RU). Each rule: [id, label, fn(title) -> title]. Applied in order; the report lists which rules changed a title.
// Reference: «Біта TORX® 867/4 Z TX 20×70 мм WERA 05060110001». Only the format changes — sizes, series and words stay as they are.
const SIZE_L = String.raw`(?:\d|[″"”“'])`;           // left side of a size pair ends with a digit or an inch mark
const PROF = String.raw`(?:PH\/S|PZ\/S|PH|PZ|TX|HEX|SL|SW)`;
const RULES = [
  // inch marks after a number: ″ without a space (7/16 "х50 -> 7/16″х50, 1/4" -> 1/4″)
  ['inch', 'дюйм ″', t => t.replace(/(\d\/\d+|\d,\d+) ?["”“](?=[\s×xх,)]|$)/g, '$1″').replace(/(\d)["”“](?=\s?[×xх]\s?\d)/g, '$1″').replace(/(\d\/\d+) ?''(?=[\s×xх,)]|$)/g, '$1″')],
  // decimals: «2.0» / «2, 0» -> «2,0» (only a number directly before a size separator, мм, or a closing bracket, so «KNIPEX 2, 3 предмети» stays)
  ['dec', 'десятичные «2,0»', t => t.replace(/(\d)\.(\d)(?=\s?(?:[×xхX]\s?\d|мм|mm|″|\s*[-–]|\s?\)|,? ?$|\s))/g, (m, a, b, o, s) => /\d\.\d\.\d/.test(s.slice(Math.max(0, o - 3), o + 5)) ? m : `${a},${b}`)
    .replace(/(^|[^\dA-Za-z]|HEX|SL|TX)(\d{1,2}), (\d)(?=\s?(?:[×xхX]\s?\d|мм|mm))/g, '$1$2,$3')],
  // «мм» with a space; Latin «mm» after a number -> «мм»
  ['mm', '«мм» с пробелом', t => t.replace(/(\d|″) ?(?:мм|mm)(?![a-zа-яіїє])/gi, '$1 мм')],
  // space after a profile: PH2 -> PH 2, TX20 -> TX 20, HEX3,0 -> HEX 3,0, PZ/S2 -> PZ/S 2; TORX PLUS: 20IP -> 20 IP, 30IPR -> 30 IPR
  ['prof', 'пробел после профиля', t => t.replace(new RegExp(String.raw`(^|[^A-Za-z/])(${PROF})(\d)`, 'g'), '$1$2 $3').replace(/(\d)(IPR?)(?![A-Za-z])/g, '$1 $2')],
  // × between sizes (Cyrillic х / Latin x): no spaces between two numbers («20×70 мм»), spaced « × » after «мм» or before a profile
  ['x', '«×» между размерами', t => t
    .replace(new RegExp(String.raw`(${SIZE_L}|\bIPR?)\s?[xхX×]\s?(?=\d|#)`, 'g'), '$1×')
    .replace(new RegExp(String.raw`((?<![А-Яа-яA-Za-z])мм)\s?[xхX×]\s?(?=\d|#|${PROF}\b)`, 'g'), '$1 × ')
    .replace(new RegExp(String.raw`(\d)\s?[xхX]\s?(?=${PROF} ?\d)`, 'g'), '$1 × ')],
  // a profile right after a separator («PH2xPH2x45» -> «PH 2 × PH 2×45»)
  ['prof', 'пробел после профиля', t => t.replace(new RegExp(String.raw`([×xх] ?)(${PROF})(\d)`, 'g'), '$1$2 $3')],
  // a size pair at the very end without a unit: «PH/S 1×80 WERA …» -> «PH/S 1×80 мм WERA …»
  ['mm+', 'добавлено «мм» после размера', t => t.replace(/(\d×\d+(?:,\d)?)(?=\s+W(?:ERA|era)\s+\d{11}\s*$)/, '$1 мм')],
  // square drive: «#2» (no space); the word «квадрат» before it when the title does not name the square already («Robertson», «квадрат…»)
  ['hash', 'квадрат «#2»', t => { let s = t.replace(/# (\d)/g, '#$1'); if (!/квадрат|Robertson/i.test(s)) s = s.replace(/(^|\s)#(\d+)(?=×| |$)(?!\d*-\d)/g, '$1квадрат #$2'); return s; }],
  // ® on WERA's registered profile names
  ['tm', '® у торговых марок', t => t.replace(/TORX ?PLUS(?!®)/g, 'TORX PLUS®').replace(/TORX(?![ ]?PLUS|®|-)/g, 'TORX®').replace(/TORX®(?=BO)/g, 'TORX® ')
    .replace(/TORQ-SET(?!®)/g, 'TORQ-SET®').replace(/TRI-WING(?!®)/g, 'TRI-WING®').replace(/Microstix(?!®)/g, 'Microstix®')],
];
// end of title: «… WERA <article>»
function tail(t, art) { const re = new RegExp(String.raw`\s*,?\s*\bW(?:era|ERA)\s+${art}\s*$`);
  // «… HF 1 05003180001», «… предметів, 05006634001»: the article ends the title without «WERA» right before it (Wera 2go is a series name)
  const bare = new RegExp(String.raw`\s*,?\s+${art}\s*$`), anyBrand = /\bW(?:era|ERA)\b(?! 2go)/;
  if (!re.test(t) && bare.test(t) && !anyBrand.test(t.replace(bare, ''))) return { t: t.replace(bare, ` WERA ${art}`), ok: true, added: true };
  if (re.test(t)) return { t: t.replace(re, ` WERA ${art}`), ok: true };
  if (!new RegExp(art).test(t) && !/\bWERA\b|\bWera\b/.test(t)) return { t: `${t.trim()} WERA ${art}`, ok: true, added: true };
  return { t, ok: false }; }
const clean = t => t.replace(/[​‌‍﻿]/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([,)])/g, '$1').replace(/\(\s+/g, '(').trim();
function apply(t, art) { const hit = []; let s = clean(t); if (s !== t) hit.push('space');
  for (const [id, , f] of RULES) { const n = clean(f(s)); if (n !== s) { hit.push(id); s = n; } }
  const tl = tail(s, art); if (tl.ok && tl.t !== s) { hit.push(tl.added ? 'wera+' : 'wera'); s = tl.t; }
  return { t: s, hit, tailOk: tl.ok }; }
const LABEL = { space: 'лишние пробелы', ...Object.fromEntries(RULES.map(([id, l]) => [id, l])), wera: '«WERA <артикул>» в конце', 'wera+': 'добавлено «WERA <артикул>»' };
module.exports = { apply, LABEL, RULES };
