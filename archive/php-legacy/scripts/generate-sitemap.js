// Генератор sitemap.xml для библиотеки
// Запуск: node generate-sitemap.js

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SITE_URL = 'https://bibliotechka.site'; // Замените на ваш домен

// Настройки подключения к БД
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'bibliotechka_user',
    password: 'user_password_change_me',
    database: 'bibliotechka',
    charset: 'utf8mb4'
};

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function generateSitemap(groups, cards) {
  let urls = [`  <url><loc>${SITE_URL}/</loc></url>`];

  // Разделы - используем красивые URL
  groups.forEach(group => {
    const slug = String(group.slug || '');
    urls.push(`  <url><loc>${SITE_URL}/${escapeXml(slug)}</loc></url>`);
  });

  // Карточки
  cards.forEach(card => {
    const slug = String(card.slug || '');
    const urlSeoYandex = card.url_seo_yandex || '';
    // Используем красивый URL если есть url_seo_yandex, иначе fallback
    const cardUrl = urlSeoYandex 
      ? `/card/${escapeXml(urlSeoYandex)}`
      : `/detail.html?slug=${escapeXml(slug)}`;
    urls.push(`  <url><loc>${SITE_URL}${cardUrl}</loc></url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

async function main() {
  let connection;
  
  try {
    console.log('Подключение к базе данных...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Подключение установлено');

    // Загружаем группы
    console.log('Загрузка групп...');
    const [groups] = await connection.execute(
      'SELECT slug FROM `groups` ORDER BY sort, slug'
    );
    console.log(`Загружено групп: ${groups.length}`);

    // Загружаем карточки со статусом published
    console.log('Загрузка карточек...');
    const [cards] = await connection.execute(
      `SELECT slug, url_seo_yandex 
       FROM \`data\` 
       WHERE status_slug = 'published' 
       ORDER BY slug`
    );
    console.log(`Загружено карточек: ${cards.length}`);
    
    const sitemap = generateSitemap(groups, cards);
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log(`sitemap.xml создан: ${sitemapPath}`);
  } catch (error) {
    console.error('Ошибка при генерации sitemap:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Соединение закрыто');
    }
  }
}

main();
