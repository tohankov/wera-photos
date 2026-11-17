# Картинки в описаниях — финальная проверка, 17.11.2026

Свежая полная выгрузка: 3591 товар, видимых 3548. Скрипт — `tools/vt/descimg_plan.js`.
Проверены все `<img>` в описаниях UA и RU, кроме наших значков (`/content/uploads/images/icons/`, включая icon-pdf), картинок блоков «Склад набору» и фото «в работе».

## Убрано (есть блок / наша таблица)

- **05136609001**, Різдвяний календар 2024: старая HTML-таблица состава (`<table class="table table-bordered">`), 15 картинок с подписями. Стояла прямо над блоком и повторяла его. Убрана в UA и RU, остальной текст не тронут.
  - Сверка выгрузки = план.
  - sec_check — 0 (раздел 1267).
  - Витрина UA и /ru/: таблицы нет, блок на месте, картинки блока загружаются. Скриншоты — `docs/pilot/shots_descimg/`.
- Повторный прогон скрипта: среди товаров с блоком или нашей таблицей таких картинок больше нет.

## Наборы без блока (не трогал)

Пустые ложементы, сумки, календарь 2020, 05135825001 Hex-Plus: картинок в описаниях нет, кроме значка PDF. Список пуст.

## Не считаются

- 05134015001 (гитарный набор): 2 фото «в работе» (`vorteil_gitarre_*.jpeg`) — оставлены.

## Ждут решения — 14 одиночных товаров без блока и без нашей таблицы

На каждой картинке — скриншот строки таблицы WERA: значки и размеры этого товара. Картинка одна и та же в UA и RU.

| Товар | Картинка | Что на ней |
|---|---|---|
| [05003500001](https://tl-shop.com.ua/triskachka-zyklop-speed-8000-a-z-pryiednuvalnym-kvadratom-1-4-wera-05003500001/) Тріскачка Zyklop Speed 8000 A 1/4″ | 05003500001.png (в ссылке) | квадрат 1/4″, длина 152,0 мм |
| [05003991001](https://tl-shop.com.ua/ruchka-trymach-kraftform-vde-3817-nerzhaviiucha-stal-wera-05003991001/) Ручка-тримач Kraftform VDE 3817 | 05003991001.png | шестигранник 9 мм, длина 98 мм |
| [05005655001](https://tl-shop.com.ua/odnopoliusnyi-indykator-napruhy-wera-05005655001/) Однополюсний індикатор напруги | 05005655001.png (в ссылке) | 0,5 / 3,0 / 70 мм, Ø 3,0 мм, 1/8″, 2 3/4″ |
| [05020104001](https://tl-shop.com.ua/rozhkovyi-kliuch-iz-samonalashtuvanniam-joker-xl-19-24-mm-wera-05020104001/) 6004 Joker XL 19–24 мм | 05020104001.png (в ссылке) | Code, EAN 4013288 216915, 19–24 мм, 3/4″–15/16″, 256 мм, 16 мм |
| [05042605001](https://tl-shop.com.ua/perekhidnyk-iz-pryvodom-1-4-wera-05042605001/) Перехідник 780 A/1 | 05042605001.png (в ссылке) | 780 A/1: 1/4″, 25 мм, 1″, квадрат 1/4″ |
| [05042750001](https://tl-shop.com.ua/perekhidnyk-z-pryvodom-1-4-iz-shvydkozatysknym-patronom-wera-05042750001/) Перехідник 784 A/1 | 05042750001.png (в ссылке) | 784 A/1: 1/4″, 30 мм, 1 3/16″, квадрат 1/4″ |
| [05050005001](https://tl-shop.com.ua/vytiahuvach-haiok-wera-05050005001/) Витягувач гайок | 05050005001.png (в ссылке) | 14,0 мм, 43,0 мм |
| [05050510001](https://tl-shop.com.ua/opravka-khvostovyk-perekhidnyk-dlia-mashynnoho-keruvannia-1-2-pryvid-7-16-wera-05050510001/) Оправка-хвостовик 870/7 | 05050510001.png (в ссылке) | квадрат 1/2″, 75 мм, 3″, шестигранник 7/16″ |
| [05075656001](https://tl-shop.com.ua/dynamometrychnyi-kliuch-dlia-zminnykh-instrumentiv-click-torque-x-6-80-400-nm-wera-05075656001/) Click-Torque X 6 | 05075656001.png (в ссылке) | 14×18, 80–400 Нм, 60–295 lbf·ft, 655 / 140 / 47 / 32 / 26 мм + дюймы; очень мелко (784×68) |
| [05075690001](https://tl-shop.com.ua/dynamometrychnyi-kliuch-lock-a-5-serii-click-torque-rehulovanyi-funktsiia-vidkliuchennia-zatiazhky-torque-lock-reversna-triskachka-dlia-pravoi-zatiazhky-2.5-25-nm-wera-05075690001/) Click-Torque Lock A 5 | 05075690001.png | заголовок по-русски «Другие варианты таких изделий:» (и в UA); квадрат 1/4″, 2,5–25 Нм, 1–18 lbf·ft, 299 / 123 / 42 / 26 / 11,75 мм + дюймы |
| [05075691001](https://tl-shop.com.ua/dynamometrychnyi-kliuch-lock-a-6-serii-click-torque-rehulovanyi-funktsiia-vidkliuchennia-zatiazhky-torque-lock-reversna-triskachka-dlia-pravoi-zatiazhky-2.5-25-nm-wera-05075691001/) Click-Torque Lock A 6 | 05075691001.png | то же, привод — значок шестигранника, 1/4″ |
| [05075692001](https://tl-shop.com.ua/dynamometrychnyi-kliuch-c-3-lock-serii-click-torque-rehulovanyi-reversna-triskachka-funktsiia-vidkliuchennia-zatiazhky-torque-lock-40-200-nm-wera-05075692001/) Click-Torque C 3 Lock | 05075692001.png | то же: квадрат 1/2″, 40–200 Нм, 30–146 lbf·ft, 512 / 140 / 47 / 43 / 18,4 мм |
| [05075810001](https://tl-shop.com.ua/dynamometrychna-vykrutka-7510-kraftform-safe-torque-speed-1-3-nm-wera-05075810001/) 7510 Safe-Torque Speed 1–3 Нм | 05075810001-1.png | шестигранник 1/4″, 1,0 / 1,5 / 2,0 / 2,5 / 3,0 Нм, 147,5 мм |
| [05078200001](https://tl-shop.com.ua/nasadka-7773-a-z-kvadratnym-pryiednuvalnym-1-4-pryvid-912-mm-wera-05078200001/) Насадка 7773 A 1/4″ | 05078200001.png (в ссылке) | квадрат 1/4″, 44,0 / 28,0 / 21,0 / 14,0 мм |
| [05078210001](https://tl-shop.com.ua/nasadka-7773-c-z-kvadratnym-pryiednuvalnym-1-2-pryvid-912-mm-wera-05078210001/) Насадка 7773 C 1/2″ | 05078210001.png (в ссылке) | квадрат 1/2″, 44,0 / 28,0 / 21,0 / 14,0 мм |

Варианты: а) оставить как есть; б) убрать (если эти размеры уже есть текстом под «Характеристики»); в) заменить нашей HTML-таблицей вариантов серии.
