// Скрипт для главной страницы

// Правило 300/500: задержка перед показом скелетонов и минимальное время показа
const SKELETON_DELAY = 300;
const SKELETON_MIN_DISPLAY = 500;

// Конфигурация API
const API_BASE = window.CONFIG?.API_BASE || '/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
    const groupsSkeletons = document.getElementById('groups-skeletons');
    const cardsSkeletons = document.getElementById('cards-skeletons');
    
    // Скрываем скелетоны изначально
    if (groupsSkeletons) groupsSkeletons.style.display = 'none';
    if (cardsSkeletons) cardsSkeletons.style.display = 'none';
    
    let skeletonsShown = false;
    let skeletonsShownAt = 0;
    
    // Показываем скелетоны через 300ms, если данные ещё не загрузились
    const skeletonTimer = setTimeout(() => {
        if (groupsSkeletons) groupsSkeletons.style.display = '';
        if (cardsSkeletons) cardsSkeletons.style.display = '';
        skeletonsShown = true;
        skeletonsShownAt = Date.now();
    }, SKELETON_DELAY);
    
    try {
        // Используем легковесные эндпоинты для главной страницы
        // 1. Легковесный groups (только основные поля)
        // 2. Легковесный cards (только для превью)
        const [dataResponse, groupsResponse] = await Promise.all([
            fetch(window.CONFIG?.getApiUrl('data/list', { status_slug: 'published' }) || `${API_BASE}/data/list?status_slug=published`),
            fetch(window.CONFIG?.getApiUrl('groups/list') || `${API_BASE}/groups/list`)
        ]);

        if (!dataResponse.ok) {
            throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }
        if (!groupsResponse.ok) {
            throw new Error(`HTTP error! status: ${groupsResponse.status}`);
        }

        const data = await dataResponse.json();
        const groups = await groupsResponse.json();
        
        // Отменяем таймер, если данные пришли быстро
        clearTimeout(skeletonTimer);
        
        // Сортировка групп по свойству sort
        const sortedGroups = groups.slice().sort((a, b) => a.sort - b.sort);

        // Показываем контент сразу без задержки
        // Если скелетоны были показаны, они будут скрыты в displayGroups/displayCards
        displayGroups(sortedGroups);
        displayCards(data);
    } catch (error) {
        // Отменяем таймер при ошибке
        clearTimeout(skeletonTimer);
        
        console.error('Ошибка загрузки данных:', error);
        
        // Скрываем скелетоны при ошибке
        if (groupsSkeletons) groupsSkeletons.style.display = 'none';
        if (cardsSkeletons) cardsSkeletons.style.display = 'none';
        
        // Можно показать сообщение пользователю
        const container = document.querySelector('.cards-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Не удалось загрузить данные. Пожалуйста, обновите страницу.</p>';
        }
    }
});

// Функция для перемешивания массива (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Функция для отображения групп
function displayGroups(groups) {
    const container = document.querySelector('.groups-container');
    const template = document.querySelector('.group-template');
    const skeletons = document.getElementById('groups-skeletons');

    if (!container || !template) {
        console.error('Контейнер или шаблон групп не найден');
        return;
    }

    // Скрываем скелетоны
    if (skeletons) skeletons.remove();

    groups.forEach(group => {
        const clone = template.content.cloneNode(true);

        const card = clone.querySelector('.group');
        const img = clone.querySelector('.group-cover');
        const title = clone.querySelector('.group-title');
        const description = clone.querySelector('.group-description');

        card.href = window.CONFIG?.getGroupUrl(group.slug) || `/${group.slug}`;
        img.src = group.cover;
        img.alt = group.title_ru || group.title;
        title.textContent = group.title_ru || group.title;

        const descriptionText = group.description_ru || group.description;
        if (descriptionText) {
            description.textContent = descriptionText;
            description.hidden = false;
        }

        container.appendChild(clone);
    });
}

// Функция для отображения карточек
function displayCards(data) {
    const container = document.querySelector('.cards-container');
    const template = document.querySelector('.card-template');
    const skeletons = document.getElementById('cards-skeletons');

    if (!container || !template) {
        console.error('Контейнер или шаблон карточек не найден');
        return;
    }

    // Скрываем скелетоны
    if (skeletons) skeletons.remove();

    // API уже возвращает только опубликованные карточки (status_slug=published)
    // Убираем лишнюю фильтрацию на клиенте - экономия CPU
    const publishedCards = data;

    // Обновляем количество карточек
    const cardsCountElement = document.getElementById('cards-count');
    if (cardsCountElement) {
        cardsCountElement.textContent = publishedCards.length;
    }

    // Перемешиваем карточки
    shuffleArray(publishedCards);

    publishedCards.forEach(item => {
        const clone = template.content.cloneNode(true);

        const card = clone.querySelector('.card');
        const img = clone.querySelector('.card-cover');
        const title = clone.querySelector('.card-title');
        const description = clone.querySelector('.card-description');

        card.href = window.CONFIG?.getCardUrl(item.slug, item.url_seo_yandex) || `/detail.html?slug=${item.slug}`;
        img.src = item.cover;
        img.alt = item.title;
        title.textContent = item.title;

        description.textContent = item.description || '';
        description.hidden = !item.description;

        container.appendChild(clone);
    });
}