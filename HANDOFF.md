# HANDOFF — 13.11.2026 (6-й промпт владельца, идёт)

## ИДЁТ СЕЙЧАС (13.11)
- П.1 квадраты 762: работа scratchpad sq/ (cut/<art>.png, list.json, replace_state.json, checked.json). Цикл: node sqnext.js sq 25 → TAG=sq1113 main_replace sq sq/p.json 540 → bash sqcheck.sh (refresh + sec_check + checked). Сделано 505 / 762, sec_check 0.
- П.2 блоки: setblock.js уже даёт wsq/wsc (vt/square_ratio.js). ДАЛЬШЕ после квадратов: точечная замена src в блоках (старый главный → текущий; + 200 устаревших в 19 блоках), стиль .wsb img.wsq/wsc, desc_write порциями, block_site_check. Порог cover — w/h ≥ 1,62 (обрезка ≤ 0,5 px), ниже — contain (1 позиция 05074705001).
- П.3 HEX IMP DC — сделано. П.4 Zyklop — витрина = план, _configured обновлён.


## Состояние
Все группы меню WERA пройдены. Итог и один список вопросов — **docs/report_1112c.md**.

## Сделано 12.11 (5)
- 05057667001 — главное на квадратном прозрачном холсте (`lib/square.js`); витрина проверена (`vt/main_zone.js`). Правило — в CLAUDE.md.
- IMP DC, 30 бит (`photos_audit/impdc_gal.js` → `gallery_override`, plan `photos_audit/gal_impdc30_plan.json`):
  - главное — паспорт, стр. 4, `cut` с `holeMin: 1`, квадрат;
  - коробка и дубли убраны;
  - таблицы 31 бита: без «N ×», колонка «Розмір» / «Размер» (`cat/impdc_tab_plan.json`).
- Вытянутые главные: 762 из 3529 — план docs/global_square_plan.md / .csv (`photos_audit/aspect_audit.js`), **без записи**.
- HF по составу: 15 наборов Joker + 27 Zyklop (`cat/ghf_sets_plan.json`); генераторы — `joker_hf.js`, `zyk_feat.js`.
- Zyklop: 5 разделов владельца = план на витрине; `_configured` обновлён (бэкап — backup/night_plan_zyklop_configured_1112.json). Осталось 6 разделов наборов — добавить «Особливості головки».

## Ждёт владельца
1. «ок» по квадратному холсту для 762. Как делать:
   - `main_replace`: work/cut/<art>.png = `square(текущее главное)`, TAG `sq1112`, порции по ~25;
   - после каждой порции — сверка и восстановление, sec_check, `vt/main_zone.js` выборочно;
   - блоки наборов не пересобирать.
2. Админка Zyklop, 6 разделов → «готово» → `sec_scan` + `sec_heads` + `plan_vs_site`, затем `_configured` = `night_plan_zyklop.json`.
3. HEX IMP DC: «3.0×25» → «HEX 3,0×25»?

## Не трогать
- Ссылки на сторонний инструмент в блоках.
- Vario.
- Промо-стикеры.
- tools/tmp_curl.out.

## Рабочие файлы (scratchpad)
- all11.json — свежая выгрузка, обновлена по всем записанным товарам.
- aspect.json — размеры главных PNG.
- portions.js — порции для sec_check.
