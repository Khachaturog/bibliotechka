#!/usr/bin/env node
// Отправка URL в Яндекс и Bing через IndexNow для быстрой переиндексации.
// Документация: https://www.indexnow.org/ru_ru/documentation
// Запуск: node scripts/submit-indexnow.js [путь к sitemap.xml]

const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE_URL = 'https://bibliotechka.site';
const INDEXNOW_KEY = 'bibliotechka-indexnow-a1b2c3d4';
const KEY_FILE_URL = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const MAX_URLS_PER_REQUEST = 10000;

// Эндпоинты IndexNow (Яндекс и общий API для Bing и др.)
const ENDPOINTS = [
  { name: 'Yandex', url: 'https://yandex.com/indexnow' },
  { name: 'IndexNow (Bing и др.)', url: 'https://api.indexnow.org/indexnow' },
];

function extractUrlsFromSitemap(sitemapPath) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(data, 'utf8'),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: raw });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function submitBatch(endpoint, host, key, keyLocation, urlList) {
  const body = { host, key, keyLocation, urlList };
  const result = await postJson(endpoint.url, body);
  return result;
}

async function main() {
  const sitemapPath = path.resolve(
    process.cwd(),
    process.argv[2] || 'sitemap.xml'
  );

  if (!fs.existsSync(sitemapPath)) {
    console.error('Файл sitemap не найден:', sitemapPath);
    console.error('Использование: node scripts/submit-indexnow.js [sitemap.xml]');
    process.exit(1);
  }

  const urls = extractUrlsFromSitemap(sitemapPath);
  console.log('Загружено URL из sitemap:', urls.length);

  if (urls.length === 0) {
    console.error('В sitemap нет URL.');
    process.exit(1);
  }

  const host = new URL(SITE_URL).hostname;

  for (const endpoint of ENDPOINTS) {
    console.log('\n---', endpoint.name, '---');
    const batches = [];
    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
      batches.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));
    }
    for (let i = 0; i < batches.length; i++) {
      const urlList = batches[i];
      try {
        const { statusCode, body } = await submitBatch(
          endpoint,
          host,
          INDEXNOW_KEY,
          KEY_FILE_URL,
          urlList
        );
        if (statusCode === 200) {
          console.log(`  Пакет ${i + 1}/${batches.length}: OK (${urlList.length} URL)`);
        } else if (statusCode === 202) {
          console.log(`  Пакет ${i + 1}/${batches.length}: 202 Accepted (ключ ещё проверяется)`);
        } else {
          console.error(`  Пакет ${i + 1}/${batches.length}: ${statusCode}`, body || '');
        }
      } catch (err) {
        console.error(`  Ошибка для ${endpoint.name}:`, err.message);
      }
    }
  }

  console.log('\nГотово. Проверьте, что на сайте доступен файл ключа:', KEY_FILE_URL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
