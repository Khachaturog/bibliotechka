// Конфигурация API

/**
 * Убирает Mixed Content: на HTTPS-странице нельзя дергать http:// API.
 * Если API_BASE задан абсолютным URL на тот же хост — оставляем только путь (/api/v1/...).
 * Иначе http → https, когда страница открыта по HTTPS.
 */
function normalizeApiBase(base) {
    const fallback = '/api/v1';
    if (base == null || base === '') return fallback;
    if (typeof base !== 'string') return fallback;
    const trimmed = base.trim();
    if (trimmed.startsWith('/')) {
        const p = trimmed.replace(/\/+$/, '');
        return p || fallback;
    }
    if (typeof window === 'undefined' || !window.location) return trimmed;
    try {
        const u = new URL(trimmed);
        const host = window.location.hostname;
        if (u.hostname === host) {
            const path = (u.pathname || '/').replace(/\/+$/, '');
            return path || fallback;
        }
        if (window.location.protocol === 'https:' && u.protocol === 'http:') {
            return 'https://' + u.host + (u.pathname.replace(/\/+$/, '') || '');
        }
    } catch (e) {
        return fallback;
    }
    return trimmed;
}

const CONFIG = {
    // Единый подход к роутингу для всех окружений
    // Используем стандартный путь /api/v1 для всех случаев
    
    API_BASE: '/api/v1',
    
    // Функция для построения URL API
    getApiUrl: function(endpoint, params = {}) {
        // Убираем лишние слэши в начале и конце endpoint
        endpoint = endpoint.replace(/^\/+|\/+$/g, '');
        
        // Используем стандартный путь для всех окружений
        const queryString = new URLSearchParams(params).toString();
        let url = `${this.API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;
        
        // Убираем двойные слэши (кроме протокола)
        url = url.replace(/([^:]\/)\/+/g, '$1');
        
        // Абсолютный URL (другой домен / после http→https) не трогаем
        if (/^https?:\/\//i.test(url)) {
            return url;
        }
        // Относительный путь: ведущий /
        if (!url.startsWith('/')) {
            url = '/' + url;
        }
        
        return url;
    },
    
    // Функция для генерации красивых URL групп
    getGroupUrl: function(slug, hash = '') {
        // Красивый URL: /designsystem или /designsystem#subgroup
        const hashPart = hash ? `#${hash}` : '';
        return `/${slug}${hashPart}`;
    },
    
    // Функция для генерации красивых URL карточек
    getCardUrl: function(slug, urlSeoYandex = '') {
        // Если есть url_seo_yandex, используем красивый URL: /card/gajd-po-tekstam-v-interfejse-001
        if (urlSeoYandex) {
            return `/card/${urlSeoYandex}`;
        }
        return `/card/${slug}`;
    },
    
    // Для продакшена (если API на другом домене)
    // API_BASE: 'https://api.bibliotechka.online/v1',
};

CONFIG.API_BASE = normalizeApiBase(CONFIG.API_BASE);

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
