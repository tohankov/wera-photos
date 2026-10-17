// Own SEO title / description (UA, RU) for the home page, info pages and categories whose name already carries WERA (owner decision 18.10.2026):
// these get the category SEO template otherwise («Головна …», «купити», WERA twice). node names/seo_pages_write.js [write]
// Backup: backup/seo_pages_before.json (the fields as read by names/seo_pages.js). dryRun first; after the write each page is re-read.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const WRITE = process.argv[2] === 'write';
const D = 'офіційний дистриб\'ютор WERA в Україні', DR = 'официальный дистрибьютор WERA в Украине';
const P = {
  1: [['Інструмент WERA — офіційний дистриб\'ютор в Україні | TL-Shop', `TL-Shop (ТОВ «Техлайт») — ${D}: викрутки, біти, тріскачки, ключі. Гарантія виробника 12 міс., доставка Новою поштою.`],
      ['Инструмент WERA — официальный дистрибьютор в Украине | TL-Shop', `TL-Shop (ООО «Техлайт») — ${DR}: отвёртки, биты, трещотки, ключи. Гарантия производителя 12 мес., доставка Новой почтой.`]],
  97: [['Каталог інструменту WERA | TL-Shop', `Каталог інструменту WERA: викрутки, біти, тріскачки Zyklop, гайкові ключі Joker, динамометричний інструмент. TL-Shop — ${D}.`],
       ['Каталог инструмента WERA | TL-Shop', `Каталог инструмента WERA: отвёртки, биты, трещотки Zyklop, гаечные ключи Joker, динамометрический инструмент. TL-Shop — ${DR}.`]],
  927: [[`Про нас — TL-Shop, ${D}`, `TL-Shop — інтернет-магазин ТОВ «Техлайт», офіційного дистриб'ютора WERA в Україні. Понад 18 років на ринку професійного інструменту.`],
        [`О нас — TL-Shop, ${DR}`, 'TL-Shop — интернет-магазин ООО «Техлайт», официального дистрибьютора WERA в Украине. Более 18 лет на рынке профессионального инструмента.']],
  928: [['Оплата і доставка | TL-Shop', 'Оплата готівкою, накладеним платежем або на рахунок ТОВ «Техлайт». Доставка Новою поштою по Україні, отримання в офісі в Полтаві.'],
        ['Оплата и доставка | TL-Shop', 'Оплата наличными, наложенным платежом или на счёт ООО «Техлайт». Доставка Новой почтой по Украине, получение в офисе в Полтаве.']],
  573: [['Обмін та повернення | TL-Shop', 'Обмін і повернення товару протягом 14 днів відповідно до Закону «Про захист прав споживачів». Умови повернення в інтернет-магазині TL-Shop.'],
        ['Обмен и возврат | TL-Shop', 'Обмен и возврат товара в течение 14 дней согласно Закону «О защите прав потребителей». Условия возврата в интернет-магазине TL-Shop.']],
  686: [[`Контакти — TL-Shop, ${D}`, `Контакти TL-Shop (ТОВ «Техлайт»): офіс у Полтаві, просп. Віталія Грицаєнка, 13А. Офіційний дистриб'ютор WERA в Україні.`],
        [`Контакты — TL-Shop, ${DR}`, 'Контакты TL-Shop (ООО «Техлайт»): офис в Полтаве, просп. Виталия Грицаенко, 13А. Официальный дистрибьютор WERA в Украине.']],
  1001: [['Блог про інструмент WERA | TL-Shop', `Статті про інструмент WERA від TL-Shop — офіційного дистриб'ютора WERA в Україні.`],
         ['Блог об инструменте WERA | TL-Shop', 'Статьи об инструменте WERA от TL-Shop — официального дистрибьютора WERA в Украине.']],
  1052: [['Угода користувача | TL-Shop', 'Положення про обробку і захист персональних даних покупців інтернет-магазину TL-Shop (ТОВ «Техлайт»).'],
         ['Пользовательское соглашение | TL-Shop', 'Положение об обработке и защите персональных данных покупателей интернет-магазина TL-Shop (ООО «Техлайт»).']],
  1053: [['Відгуки про магазин TL-Shop', `Відгуки покупців про інтернет-магазин TL-Shop — офіційного дистриб'ютора WERA в Україні.`],
         ['Отзывы о магазине TL-Shop', 'Отзывы покупателей об интернет-магазине TL-Shop — официального дистрибьютора WERA в Украине.']],
  1054: [['Мапа сайту | TL-Shop', 'Мапа сайту TL-Shop: усі розділи каталогу інструменту WERA та інформаційні сторінки.'],
         ['Карта сайта | TL-Shop', 'Карта сайта TL-Shop: все разделы каталога инструмента WERA и информационные страницы.']],
  // category whose name already has «Wera»: the category template would repeat WERA
  1269: [['Сумки для інструментів Wera 2go — купити | TL-Shop', 'Сумки для інструментів Wera 2go — купити в TL-Shop, офіційного дистриб\'ютора в Україні. Гарантія виробника 12 міс., доставка Новою поштою.'],
         ['Сумки для инструментов Wera 2go — купить | TL-Shop', 'Сумки для инструментов Wera 2go — купить в TL-Shop, официального дистрибьютора в Украине. Гарантия производителя 12 мес., доставка Новой почтой.']] };
(async () => { const before = require('./pages_seo.json'); const bk = 'C:/Users/Techlight/Desktop/wera-photos/backup/seo_pages_before.json';
  if (!fs.existsSync(bk)) fs.writeFileSync(bk, JSON.stringify(Object.fromEntries(Object.keys(P).map(id => [id, before[id].languages]))));
  for (const [id, [[tu, du], [tr, dr]]] of Object.entries(P)) { console.log(id, `UA ${tu.length}/${du.length} RU ${tr.length}/${dr.length}`);
    for (const [l, t] of [['ua', before[id].languages.ua], ['ru', before[id].languages.ru]]) if (t.seo_title || t.seo_description) { console.log('STOP: page', id, l, 'already has own SEO fields'); process.exit(2); }
    await new Promise(r => setTimeout(r, 1200));
    const r = await S.call('horoshop_admin_page_seo_set', { id: +id, dryRun: !WRITE, langs: { ua: { seo_title: tu, seo_description: du }, ru: { seo_title: tr, seo_description: dr } } });
    const ch = (r.willChange || r.changes || []).map(c => c.field || c.lang + '.' + c.key); const bad = JSON.stringify(r).match(/"(title|h1|text|seo_keywords)"\s*:\s*\{\s*"from"/);
    if (r.error || bad) { console.log('STOP', id, JSON.stringify(r).slice(0, 600)); process.exit(2); }
    if (WRITE) console.log('  saved', JSON.stringify(r.verified || r.persisted || r.saved || r).slice(0, 300)); else console.log('  dryRun', JSON.stringify(r).slice(0, 400)); }
  S.close(); })();
