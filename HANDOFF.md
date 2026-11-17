# HANDOFF — 17.11.2026 (7-й промпт владельца)

## Задачи
1. Картинки в описаниях (весь каталог, UA / RU) — **готово**, docs/report_1117_descimg.md. Убрана старая таблица состава у 05136609001. 14 одиночных товаров со скриншотом строки таблицы WERA ждут решения.
2. Кнопка PDF — отступ под рамкой, `<p style="margin:0 0 16px;padding-bottom:4px">`.
   - Пример 05056305001 записан, витрина ок (docs/pilot/shots_pdfgap/).
   - Весь каталог: план 3540 товаров. Пишет `cat/desc_write.js` порциями по 10, состояние — `tools/cat/desc_pdfgap1117_state.json` (resumable).
   - Продолжить: `node vt/pdfgap_plan.js <свежая all.json> <plan>` (уже записанные в план не попадут) → `node cat/desc_write.js <plan> 10 30000`.
   - Потом `sec_check` порциями и `vt/pdf_frame_check.js` выборочно.
3. Итог по WERA (docs/report_1117.md) и HANDOFF — после шага 2.

## Правила (CLAUDE.md)
- Кнопка PDF — `PDF_P` в `vt/table2.js`. Проверка витрины — `vt/pdf_frame_check.js`.
- Картинки в описаниях — `vt/descimg_plan.js`.
- Скрытые товары (78 с кнопкой PDF) не трогаются.
- Коммиты — в main, автор как в прошлых коммитах (`git -c user.name=… -c user.email=…`: в этой среде git identity не настроен).

## Не трогать
- Ссылки на сторонний инструмент в блоках.
- Vario.
- Промо-стикеры.
- tools/tmp_curl.out.

## Рабочие файлы (scratchpad этой сессии; новая сессия — свежая `lib/full_export.js`)
- all17.json — полная выгрузка 17.11 (14 полей).
- menu17.json — дерево меню.
- pdfgap_plan.json — план шага 2.
