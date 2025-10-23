// Генератор sitemap.xml для библиотеки
// Запуск: node generate-sitemap.js

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bibliotechka.online'; // Замените на ваш домен
const groupPath = path.join(__dirname, 'data', 'group.json');
const dataPath = path.join(__dirname, 'data', 'data.json');

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function generateSitemap(groups, cards) {
  let urls = [`  <url>\n    <loc>${SITE_URL}/</loc>\n  </url>`];

  // Разделы
  groups.forEach(group => {
    const slug = String(group.slug || '');
    urls.push(`  <url>\n    <loc>${SITE_URL}/group.html?slug=${escapeXml(slug)}</loc>\n  </url>`);
  });

  // Карточки
  cards.forEach(card => {
    const slug = String(card.slug || '');
    urls.push(`  <url>\n    <loc>${SITE_URL}/detail.html?slug=${escapeXml(slug)}</loc>\n  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function main() {
  const groups = JSON.parse(fs.readFileSync(groupPath, 'utf8'));
  const cards = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const sitemap = generateSitemap(groups, cards);
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
  console.log('sitemap.xml создан!');
}

main();
