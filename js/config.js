// Конфигурация API
const CONFIG = {
    // Единый подход к роутингу для всех окружений
    // Используем стандартный путь /api/v1 для всех случаев
    
    API_BASE: '/api/v1',
    
    // Функция для построения URL API
    getApiUrl: function(endpoint, params = {}) {
        // Используем стандартный путь для всех окружений
        const queryString = new URLSearchParams(params).toString();
        return `${this.API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;
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
        // Иначе fallback на обычный URL: /detail.html?slug=001
        if (urlSeoYandex) {
            return `/card/${urlSeoYandex}`;
        }
        return `/detail.html?slug=${slug}`;
    },
    
    // Для продакшена (если API на другом домене)
    // API_BASE: 'https://api.bibliotechka.online/v1',
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
