// Скрипт для страницы деталей

// Конфигурация API
const API_BASE = window.CONFIG?.API_BASE || '/api/v1';

// Глобальная переменная для хранения данных карточки (для функции shareCard)
let currentCard = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Получаем slug из query параметров или из пути URL (для красивых URL)
    const params = new URLSearchParams(window.location.search);
    let slug = params.get('slug');
    
    // Если slug нет в query параметрах, пытаемся получить из пути URL
    // Это нужно для красивых URL типа /card/gajd-po-tekstam-v-interfejse-001
    if (!slug) {
        const path = window.location.pathname;
        // Проверяем, является ли путь красивым URL карточки
        if (path.startsWith('/card/')) {
            // Извлекаем url_seo_yandex из пути
            const urlSeoYandex = path.replace('/card/', '').split('/')[0];
            // Нужно будет найти slug по url_seo_yandex через API
            // Пока используем fallback - загрузим все карточки и найдем нужную
            try {
                const response = await fetch(window.CONFIG?.getApiUrl('data/list', { status_slug: 'published' }) || `${API_BASE}/data/list?status_slug=published`);
                if (response.ok) {
                    const cards = await response.json();
                    const foundCard = cards.find(card => card.url_seo_yandex === urlSeoYandex);
                    if (foundCard) {
                        slug = foundCard.slug;
                    }
                }
            } catch (e) {
                console.error('Ошибка поиска карточки по url_seo_yandex:', e);
            }
        }
    }
    
    if (!slug) {
        document.body.innerHTML = '<h1>Материал не найден (slug не указан)</h1>';
        return;
    }
    
    try {
        // Для детальной страницы нужны:
        // 1. Полный card (все поля карточки)
        // 2. Авторы карточки (отдельный запрос)
        // 3. Groups и subgroups (для breadcrumbs)
        const [cardResponse, authorsResponse, groupsResponse, subgroupsResponse] = await Promise.all([
            fetch(window.CONFIG?.getApiUrl('data', { slug: slug }) || `${API_BASE}/data?slug=${slug}`),
            fetch(window.CONFIG?.getApiUrl(`data/${slug}/authors`) || `${API_BASE}/data/${slug}/authors`),
            fetch(window.CONFIG?.getApiUrl('groups/list') || `${API_BASE}/groups/list`),
            fetch(window.CONFIG?.getApiUrl('subgroups') || `${API_BASE}/subgroups`)
        ]);

        if (!cardResponse.ok) {
            throw new Error(`HTTP error! status: ${cardResponse.status}`);
        }
        if (!authorsResponse.ok && authorsResponse.status !== 404) {
            // 404 для авторов - это нормально, если авторов нет
            console.warn('Authors not found');
        }
        if (!groupsResponse.ok) {
            throw new Error(`HTTP error! status: ${groupsResponse.status}`);
        }
        if (!subgroupsResponse.ok) {
            throw new Error(`HTTP error! status: ${subgroupsResponse.status}`);
        }

        const cards = await cardResponse.json();
        const authors = authorsResponse.ok ? await authorsResponse.json() : [];
        const groups = await groupsResponse.json();
        const subgroups = await subgroupsResponse.json();
        
        // API возвращает массив, берем первый элемент
        const card = cards[0];
        
        if (!card) {
            document.body.innerHTML = '<h1>Материал не найден</h1>';
            return;
        }
        
        // Объединяем авторов с карточкой для совместимости
        card.authors = authors.map(a => a.title_ru || a.title_en || a.slug);
        
        // Сохраняем карточку в глобальной переменной для функции shareCard
        currentCard = card;
        
        // Обновляем URL в браузере на красивый, если зашли через старый URL
        const currentUrl = window.location.pathname;
        const prettyUrl = window.CONFIG?.getCardUrl(card.slug, card.url_seo_yandex) || `/detail.html?slug=${card.slug}`;
        
        // Если текущий URL - старый формат, обновляем на красивый
        if (currentUrl.startsWith('/detail.html') && prettyUrl.startsWith('/card/')) {
            window.history.replaceState({}, '', prettyUrl);
        }
        
        displayDetail(card, groups, subgroups);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.body.innerHTML = '<h1>Ошибка загрузки данных. Пожалуйста, обновите страницу.</h1>';
    }
    
    // Функция для перехода к случайной карточке
    window.getRandomCardRedirect = async function() {
        try {
            // Для выбора случайной карточки нужен только slug, используем легковесный запрос
            const response = await fetch(window.CONFIG?.getApiUrl('data/list', { status_slug: 'published' }) || `${API_BASE}/data/list?status_slug=published`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.length === 0) {
                console.error('No published cards found');
                return;
            }
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomCard = data[randomIndex];
            // Используем красивый URL, если есть url_seo_yandex
            const cardUrl = window.CONFIG?.getCardUrl(randomCard.slug, randomCard.url_seo_yandex) || `/detail.html?slug=${randomCard.slug}`;
            window.location.href = cardUrl;
        } catch (error) {
            console.error('Ошибка загрузки случайной карточки:', error);
        }
    };
    
        // Функция поделиться
        window.shareCard = function() {
            // Используем красивый URL для шаринга
            if (!currentCard) {
                // Fallback на текущий URL, если карточка не загружена
                const url = window.location.href;
                const title = document.title;
                if (navigator.share) {
                    navigator.share({ title, url }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(url);
                    alert('Ссылка скопирована!');
                }
                return;
            }
            
            const prettyUrl = window.CONFIG?.getCardUrl(currentCard.slug, currentCard.url_seo_yandex) || `/detail.html?slug=${currentCard.slug}`;
            const url = `${window.location.origin}${prettyUrl}`;
            const title = document.title;
            if (navigator.share) {
                navigator.share({
                    title,
                    url
                }).catch(() => {});
            } else {
                // Веб: копируем ссылку
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(url);
                    alert('Ссылка  скопирована!');
                } else {
                    // Фоллбек для старых браузеров
                    const temp = document.createElement('input');
                    temp.value = url;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    document.body.removeChild(temp);
                    alert('Ссылкана страницу скопирована!');
                }
            }
        };
});

// Функция для перехода в группу из breadcrumbs
function navigateToGroupFromBreadcrumb(groupSlug) {
    const url = `${window.location.origin}${window.CONFIG?.getGroupUrl(groupSlug) || `/${groupSlug}`}`;
    window.location.href = url;
}

// Функция для перехода в подгруппу из breadcrumbs
function navigateToSubgroupFromBreadcrumb(groupSlug, subgroupSlug) {
    // Если параметры не переданы, получаем из DOM
    if (!groupSlug || !subgroupSlug) {
        const groupSlugElement = document.querySelector('.group-slug');
        const subgroupSlugElement = document.querySelector('.subgroup-slug');
        groupSlug = groupSlug || (groupSlugElement ? groupSlugElement.textContent : null);
        subgroupSlug = subgroupSlug || (subgroupSlugElement ? subgroupSlugElement.textContent : null);
    }
    if (groupSlug && subgroupSlug) {
        const url = `${window.location.origin}${window.CONFIG?.getGroupUrl(groupSlug, subgroupSlug) || `/${groupSlug}#${subgroupSlug}`}`;
        window.location.href = url;
    }
}

// Функция для отображения деталей
function displayDetail(item, groups, subgroups) {
    // item уже является объектом карточки (не массивом)
    if (!item) {
        document.body.innerHTML = '<h1>Материал не найден</h1>';
        return;
    }

    // --- SEO META TAGS DYNAMIC UPDATE ---
    // Title
    if (item.title) {
        document.title = item.title;
    }
    
    // Description
    if (item.description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = item.description;
    }
    // --- END SEO META TAGS ---

    const container = document.getElementById('detail-container-0');
    const template = document.getElementById('detail-template');

    if (!template) {
        console.error('Template not found');
        return;
    }

    const clone = template.content.cloneNode(true);

    // Заполняем данные в шаблоне
    const imageContainer = clone.querySelector('.detail-container-image');
    if (imageContainer) {
        const blurImage = imageContainer.querySelector('.image-blur');
        const mainImage = imageContainer.querySelector('.image:not(.image-blur)');
        
        if (blurImage) {
            blurImage.src = item.cover;
            blurImage.alt = '';
        }
        if (mainImage) {
            mainImage.src = item.cover;
            mainImage.alt = item.title;
        }
    }
    clone.querySelector('.detail-block1-title').textContent = item.title;
    clone.querySelector('.detail-block1-subtitle').textContent = item.description || '';

    // Заполняем ссылки через шаблон
    const linksContainer = clone.querySelector('.detail-block2-list');
    linksContainer.innerHTML = '';
    // Шаблон ищем в основном документе
    const linkTemplate = document.getElementById('detail-link-template');
    const links = [
        { url: item.url_1, title: item.url_title_1 },
        { url: item.url_2, title: item.url_title_2 },
        { url: item.url_3, title: item.url_title_3 },
        { url: item.url_4, title: item.url_title_4 },
        { url: item.url_5, title: item.url_title_5 },
        { url: item.url_6, title: item.url_title_6 }
    ];
    links.forEach(link => {
        if (link.url && linkTemplate) {
            const linkClone = linkTemplate.content.cloneNode(true);
            const linkElement = linkClone.querySelector('a.detail-block2-list-item');
            if (linkElement) {
                linkElement.href = link.url;
                linkElement.target = '_blank';
                const titleElem = linkElement.querySelector('.detail-block2-list-title');
                const urlElem = linkElement.querySelector('.detail-block2-list-subtitle');
                if (titleElem) titleElem.textContent = link.title || 'Ссылка';
                if (urlElem) urlElem.textContent = link.url;
                linksContainer.appendChild(linkElement);
            }
        }
    });
    // Шаблон не удаляем!

    // Заполняем авторов с проверкой наличия элементов
    const authorsContainer = clone.querySelector('.detail-block3-list');
        if (item.authors) {
            const authorElements = authorsContainer.querySelectorAll('.detail-block3-author');
            item.authors.forEach((author, index) => {
                if (authorElements[index]) {
                    // Если элемент уже есть в HTML, заполняем его
                    authorElements[index].textContent = author;
                } else {
                    console.warn(`Не хватает элементов для авторов. Добавьте больше <div class="author"> в HTML.`);
                }
            });
        } else {
            const authorElement = authorsContainer.querySelector('.detail-block3-author');
            if (authorElement) {
                authorElement.textContent = item.author_slug;
            } else {
                console.error('Элемент для автора не найден в HTML.');
            }
        }

    // Заполняем данные в блоке "Разное"
    const miscContainer = clone.querySelector('.detail-meta');
    if (miscContainer) {
        miscContainer.querySelector('.start-date').textContent = item.start_date || '-';
        miscContainer.querySelector('.end-date').textContent = item.end_date || '-';
        miscContainer.querySelector('.published').textContent = item.published || '-';
        miscContainer.querySelector('.updated-at').textContent = item.updated_at || '-';
        miscContainer.querySelector('.group-slug').textContent = item.group_slug || '-';
        miscContainer.querySelector('.subgroup-slug').textContent = item.subgroup_slug || '-';
        miscContainer.querySelector('.detail').textContent = item.detail || '-';
        miscContainer.querySelector('.slug').textContent = item.slug || '-';
        miscContainer.querySelector('.created-at').textContent = item.created_at || '-';
        miscContainer.querySelector('.version-slug').textContent = item.version_slug || '-';
        miscContainer.querySelector('.status-slug').textContent = item.status_slug || '-';
    }

    // Добавляем данные в блок "От ИИ"
    const aiSummaryBlock = clone.querySelector('.detail-ai');
    if (aiSummaryBlock) {
        aiSummaryBlock.querySelector('.detail-ai-summary').textContent = item.summary_ai || 'Однажды напишет саммари';
    }

    // Заполняем badge-title в breadcrumbs русскими названиями и добавляем обработчики клика
    const badgeTitles = clone.querySelectorAll('.badge-title');
    
    // Первая кнопка - group
    const group = groups.find(g => g.slug === item.group_slug);
    badgeTitles[0].textContent = group ? (group.title_ru || group.title) : item.group_slug || '';
    badgeTitles[0].closest('button').onclick = () => navigateToGroupFromBreadcrumb(item.group_slug);
    
    // Вторая кнопка - subgroup
    const subgroup = subgroups.find(s => s.slug === item.subgroup_slug);
    badgeTitles[1].textContent = subgroup ? (subgroup.title_ru || subgroup.title) : item.subgroup_slug || '';
    badgeTitles[1].closest('button').onclick = () => navigateToSubgroupFromBreadcrumb(item.group_slug, item.subgroup_slug);

    container.appendChild(clone);
}

