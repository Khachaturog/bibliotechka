// Скрипт для генерации поля slug_seo_yandex в data.json
// Транслитерация по правилам Яндекса (https://yandex.ru/support/webmaster/controlling-robot/robot-txt.html#transliteration)
// Для запуска: node generate-slug-en-seo-yandex.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data/data.json');

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

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));


for (const item of data) {
    if (!item.slug_seo_yandex) {
        const base = item.title ? translitYandex(item.title) : '';
        item.slug_seo_yandex = base && item.slug ? `${base}-${item.slug}` : item.slug || '';
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('slug_seo_yandex успешно добавлен в data.json');
