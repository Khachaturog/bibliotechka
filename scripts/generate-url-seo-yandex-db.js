// Скрипт для генерации поля url_seo_yandex в базе данных
// Транслитерация по правилам Яндекса
// Для запуска: node generate-url-seo-yandex-db.js

const mysql = require('mysql2/promise');

// Настройки подключения к БД
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'bibliotechka_user',
    password: 'user_password_change_me',
    database: 'bibliotechka',
    charset: 'utf8mb4'
};

// Транслитерация по Яндексу
function translitYandex(str) {
    const map = {
        'а': 'a', 
        'б': 'b', 
        'в': 'v', 
        'г': 'g', 
        'д': 'd', 
        'е': 'e', 
        'ё': 'e',
        'ж': 'zh', 
        'з': 'z', 
        'и': 'i', 
        'й': 'j', 
        'к': 'k', 
        'л': 'l', 
        'м': 'm',
        'н': 'n', 
        'о': 'o', 
        'п': 'p', 
        'р': 'r', 
        'с': 's', 
        'т': 't', 
        'у': 'u',
        'ф': 'f', 
        'х': 'h', 
        'ц': 'c', 
        'ч': 'ch', 
        'ш': 'sh', 
        'щ': 'shh',
        'ъ': '', 
        'ы': 'y', 
        'ь': '', 
        'э': 'e', 
        'ю': 'yu', 
        'я': 'ya',

        ' ': '-', 
        '_': '-', 
        '—': '-', 
        '–': '-', 

        ',': '', 
        '.': '', 
        ':': '', 
        ';': '',
        '«': '', 
        '»': '', 
        '"': '', 
        '\'': '', 
        '?': '', 
        '!': '', 
        '(': '', 
        ')': '',
        '/': '-', 
        '\\': '-', 
        '[': '', 
        ']': '', 
        '{': '', 
        '}': '',
        '№': 'no', 
        '%': '', 
        '&': '', 
        '#': '', 
        '+': '', 
        '=': '', 
        '*': '',
    };
    // Сначала заменяем подчёркивания на дефисы, затем транслитерируем
    return str
        .replace(/_/g, '-')
        .toLowerCase()
        .split('')
        .map(ch => map[ch] !== undefined ? map[ch] : ch)
        .join('')
        .replace(/-+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '');
}

// Генерация url_seo_yandex на основе title и slug
function generateUrlSeoYandex(title, slug) {
    if (!title || !slug) {
        return slug || '';
    }
    const base = translitYandex(title);
    return base ? `${base}-${slug}` : slug;
}

async function main() {
    let connection;
    
    try {
        console.log('Подключение к базе данных...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('Подключение установлено');

        // Получаем записи с пустым url_seo_yandex
        console.log('Поиск записей с пустым url_seo_yandex...');
        const [rows] = await connection.execute(
            `SELECT slug, title, url_seo_yandex 
             FROM data 
             WHERE url_seo_yandex IS NULL OR url_seo_yandex = '' 
             ORDER BY slug`
        );

        console.log(`Найдено записей: ${rows.length}`);

        if (rows.length === 0) {
            console.log('Нет записей для обновления');
            return;
        }

        // Обновляем каждую запись
        let updated = 0;
        let errors = 0;

        for (const row of rows) {
            try {
                const urlSeoYandex = generateUrlSeoYandex(row.title, row.slug);
                
                await connection.execute(
                    `UPDATE data 
                     SET url_seo_yandex = ? 
                     WHERE slug = ?`,
                    [urlSeoYandex, row.slug]
                );

                updated++;
                if (updated % 10 === 0) {
                    console.log(`Обновлено: ${updated}/${rows.length}`);
                }
            } catch (error) {
                console.error(`Ошибка при обновлении ${row.slug}:`, error.message);
                errors++;
            }
        }

        console.log('\n=== Результаты ===');
        console.log(`Всего записей: ${rows.length}`);
        console.log(`Успешно обновлено: ${updated}`);
        console.log(`Ошибок: ${errors}`);

    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Соединение закрыто');
        }
    }
}

main();

