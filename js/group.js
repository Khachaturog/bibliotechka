// Скрипт для страницы групп

// Конфигурация API
const API_BASE = window.CONFIG?.API_BASE || '/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
        // Получаем slug из query параметров или из пути URL (для красивых URL)
        const params = new URLSearchParams(window.location.search);
        let groupSlug = params.get('slug');
        
        // Если slug нет в query параметрах, пытаемся получить из пути URL
        // Это нужно для красивых URL типа /designsystem
        if (!groupSlug) {
                const path = window.location.pathname;
                // Убираем начальный и конечный слэш, фильтруем пустые части
                const pathParts = path.split('/').filter(part => part && part !== 'index.php');
                // Берем последнюю часть пути как slug
                // Например: /designsystem -> ['designsystem']
                // Берём первый сегмент пути как slug группы
                if (pathParts.length > 0) {
                        groupSlug = pathParts[pathParts.length - 1];
                }
        }
        
        if (!groupSlug) {
                console.error('Group slug not found in URL');
                return;
        }
        
        try {
                // Для страницы группы нужны:
                // 1. Полный group (со всеми SEO полями)
                // 2. Подгруппы ТОЛЬКО для этой группы (оптимизация!)
                // 3. Легковесный cards (только для списка)
                const [groupResponse, subgroupsResponse, dataResponse, groupsListResponse] = await Promise.all([
                        fetch(window.CONFIG?.getApiUrl('groups', { slug: groupSlug }) || `${API_BASE}/groups?slug=${groupSlug}`),
                        fetch(window.CONFIG?.getApiUrl('subgroups', { group_slug: groupSlug }) || `${API_BASE}/subgroups?group_slug=${groupSlug}`),
                        fetch(window.CONFIG?.getApiUrl('data/list', { group_slug: groupSlug, status_slug: 'published' }) || `${API_BASE}/data/list?group_slug=${groupSlug}&status_slug=published`),
                        fetch(window.CONFIG?.getApiUrl('groups/list') || `${API_BASE}/groups/list`)
                ]);

                if (!groupResponse.ok) {
                        throw new Error(`HTTP error! status: ${groupResponse.status}`);
                }
                if (!subgroupsResponse.ok) {
                        throw new Error(`HTTP error! status: ${subgroupsResponse.status}`);
                }
                if (!dataResponse.ok) {
                        throw new Error(`HTTP error! status: ${dataResponse.status}`);
                }
                if (!groupsListResponse.ok) {
                        throw new Error(`HTTP error! status: ${groupsListResponse.status}`);
                }

                const groups = await groupResponse.json();
                const subgroups = await subgroupsResponse.json();
                const data = await dataResponse.json();
                const groupsList = await groupsListResponse.json();
                
                // API возвращает массив, берем первый элемент
                const group = groups[0];
                
                if (!group) {
                        throw new Error('Group not found');
                }
                
                // Обновляем URL на красивый, если зашли через старый формат
                // Делаем это СРАЗУ после получения данных, ДО отрисовки контента
                const currentUrl = window.location.pathname;
                const prettyUrl = window.CONFIG?.getGroupUrl(groupSlug) || `/${groupSlug}`;
                
                if (!currentUrl.startsWith(prettyUrl)) {
                        window.history.replaceState({}, '', prettyUrl + window.location.search + window.location.hash);
                }
                
                // Обновляем заголовок и описание группы
                const titleElement = document.querySelector('.container-title');
                const descriptionElement = document.querySelector('.container-description');
                
                if (titleElement) {
                        titleElement.textContent = group.title_ru || group.title;
                }
                if (descriptionElement) {
                        descriptionElement.textContent = group.description_ru || group.description || '';
                }

                // --- SEO META TAGS DYNAMIC UPDATE ---
                // Title
                if (group.title_seo) {
                    document.title = group.title_seo;
                }
                // Description
                if (group.description_seo) {
                    let metaDesc = document.querySelector('meta[name="description"]');
                    if (!metaDesc) {
                        metaDesc = document.createElement('meta');
                        metaDesc.name = 'description';
                        document.head.appendChild(metaDesc);
                    }
                    metaDesc.content = group.description_seo;
                }
                // Keywords
                if (group.keywords_seo) {
                    let metaKeywords = document.querySelector('meta[name="keywords"]');
                    if (!metaKeywords) {
                        metaKeywords = document.createElement('meta');
                        metaKeywords.name = 'keywords';
                        document.head.appendChild(metaKeywords);
                    }
                    metaKeywords.content = group.keywords_seo;
                }
                // Open Graph
                if (group.og_title) {
                    let ogTitle = document.querySelector('meta[property="og:title"]');
                    if (!ogTitle) {
                        ogTitle = document.createElement('meta');
                        ogTitle.setAttribute('property', 'og:title');
                        document.head.appendChild(ogTitle);
                    }
                    ogTitle.content = group.og_title;
                }
                if (group.og_description) {
                    let ogDesc = document.querySelector('meta[property="og:description"]');
                    if (!ogDesc) {
                        ogDesc = document.createElement('meta');
                        ogDesc.setAttribute('property', 'og:description');
                        document.head.appendChild(ogDesc);
                    }
                    ogDesc.content = group.og_description;
                }
                if (group.og_image) {
                    let ogImg = document.querySelector('meta[property="og:image"]');
                    if (!ogImg) {
                        ogImg = document.createElement('meta');
                        ogImg.setAttribute('property', 'og:image');
                        document.head.appendChild(ogImg);
                    }
                    ogImg.content = group.og_image;
                }
                // --- END SEO META TAGS ---

                // API уже возвращает отфильтрованные данные по group_slug на сервере
                // Не нужно фильтровать на клиенте - экономия CPU
                displaySubgroupsAndCards(data, subgroups);
                displayOtherGroups(groupsList, groupSlug);
                        // Скроллим к якорю после отрисовки с задержкой 50мс
                        if (window.location.hash) {
                            setTimeout(() => {
                                const targetContainer = document.getElementById(window.location.hash.substring(1));
                                if (targetContainer) {
                                    // Ищем заголовок подгруппы
                                    const title = targetContainer.querySelector('.container-title');
                                    const scrollTarget = title || targetContainer;
                                    const offset = 83;
                                    const elementPosition = scrollTarget.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.scrollY - offset;
                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                }
                            }, 100);
                        }
        } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                
                // Показываем сообщение пользователю
                const container = document.querySelector('.subgroups-wrap');
                if (container) {
                        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Не удалось загрузить данные. Пожалуйста, обновите страницу.</p>';
                }
        }
});

// displaySubgroupsAndCards
function displaySubgroupsAndCards(data, subgroups) {
    const container = document.querySelector('.subgroups-wrap');
    container.innerHTML = ''; // Clear existing content

    const subgroupsContainers = document.querySelectorAll('.subgroups-badge-wrap');
    if (subgroupsContainers.length === 0) {
        console.error('Subgroups badge container not found');
        return;
    }

    const subgroupsToRender = subgroups.filter(subgroup => {
        const subgroupData = data.filter(item => item.subgroup_slug === subgroup.slug);
        return subgroupData.length > 0;
    });

    // Рендерим бейджи подгрупп во все контейнеры (на случай дубликатов)
    subgroupsContainers.forEach(subgroupsContainer => {
        const template = subgroupsContainer.querySelector('template.badge-template');
        if (!template) return;

        // Очищаем всё, кроме template
        Array.from(subgroupsContainer.children).forEach(child => {
            if (child.tagName !== 'TEMPLATE') child.remove();
        });

        subgroupsToRender.forEach(subgroup => {
            const badge = createBadge(subgroup, template);
            subgroupsContainer.appendChild(badge);
        });
    });

    // Рендерим контент подгрупп (карточки) один раз
    subgroupsToRender.forEach(subgroup => {
        const subgroupData = data.filter(item => item.subgroup_slug === subgroup.slug);
        const subgroupElement = createSubgroup(subgroup, subgroupData);
        container.appendChild(subgroupElement);
    });
}

// Другие группы (кроме текущей)
function displayOtherGroups(groupsList, currentGroupSlug) {
    const containers = document.querySelectorAll('.other-groups-wrap');
    if (containers.length === 0) return;

    if (!Array.isArray(groupsList)) return;

    const otherGroups = groupsList
        .filter(g => g && g.slug && g.slug !== currentGroupSlug)
        .slice()
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    if (otherGroups.length === 0) return;

    containers.forEach(container => {
        const template = container.querySelector('template.other-group-badge-template');
        if (!template) return;

        // Очищаем всё, кроме template
        Array.from(container.children).forEach(child => {
            if (child.tagName !== 'TEMPLATE') child.remove();
        });

        otherGroups.forEach(group => {
            const clone = template.content.cloneNode(true);
            const link = clone.querySelector('.other-group-badge');
            const title = clone.querySelector('.other-group-badge-title');

            if (link) {
                link.href = window.CONFIG?.getGroupUrl(group.slug) || `/${group.slug}`;
            }
            if (title) {
                title.textContent = group.title_ru || group.title || group.slug;
            }

            container.appendChild(clone);
        });

        container.hidden = false;
    });
}

function createBadge(subgroup, badgeTemplate) {
    const clone = badgeTemplate.content.cloneNode(true);
    const badge = clone.querySelector('.badge');
    const currentPathWithQuery = `${window.location.pathname}${window.location.search}`;
    badge.href = `${currentPathWithQuery}#${subgroup.slug}`;
    badge.querySelector('.badge-title').textContent = subgroup.title_ru || subgroup.title;

    // Добавляем обработчик клика для перехода к якорной ссылке
    badge.addEventListener('click', (e) => {
        e.preventDefault(); // Предотвращаем стандартное поведение
        const targetElement = document.getElementById(subgroup.slug);
        if (targetElement) {
            const offset = 70; // Отступ в px
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Обновляем URL с якорем
            history.pushState(null, null, `${currentPathWithQuery}#${subgroup.slug}`);

            // Устанавливаем класс active для текущего бейджа с задержкой
            setTimeout(() => {
                const parentWrap = badge.closest('.subgroups-badge-wrap') || document;
                parentWrap.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                centerBadge(badge);
            }, 100); // Задержка в мс
        }
    });

    return clone;
}

// Простое центрирование бейджа
function centerBadge(badge) {
    badge.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// Добавляем обработчик для изменения active бейджа при скролле
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        const wraps = document.querySelectorAll('.subgroups-badge-wrap');
        wraps.forEach(wrap => {
            const badges = wrap.querySelectorAll('.badge');
            badges.forEach(badge => {
                const targetId = new URL(badge.href, window.location.origin).hash.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const rect = targetElement.getBoundingClientRect();
                    if (rect.top <= 90  && rect.bottom > 90) { // Проверяем, находится ли блок в видимой области
                        badges.forEach(b => b.classList.remove('active'));
                        badge.classList.add('active');
                        centerBadge(badge);
                    }
                }
            });
        });
    }, 10); // Задержка 10мс после завершения прокрутки
});



// Подгруппы
const subgroupTemplate = document.getElementById('subgroup-template');

function createSubgroup(subgroup, subgroupData) {
    const clone = subgroupTemplate.content.cloneNode(true);
    const subgroupElement = clone.querySelector('.cards-container-0');
    subgroupElement.id = subgroup.slug;

    const title = clone.querySelector('.container-title');
    title.textContent = subgroup.title_ru || subgroup.title;

// Кнопка для копирования ссылки
const button = clone.querySelector('.subtle-violet-24');
const linkIcon = button.querySelector('.icon-link');
const copiedIcon = button.querySelector('.icon-copied');

    // Скрываем иконку "скопировано" при загрузке страницы
    copiedIcon.style.display = 'none';
    
    // Обработчик клика по кнопке
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${subgroup.slug}`;
        navigator.clipboard.writeText(url).then(() => {
            linkIcon.style.display = 'none';
            copiedIcon.style.display = 'inline';
            setTimeout(() => {
                linkIcon.style.display = 'inline';
                copiedIcon.style.display = 'none';
            }, 800);
        });
    });

// Описание подгруппы
    const descriptionText = subgroup.description_ru || subgroup.description;
    if (descriptionText) {
        const description = clone.querySelector('.container-description');
        description.textContent = descriptionText;
        description.hidden = false;
    }

    const cardsContainer = clone.querySelector('.cards-container');
    subgroupData.forEach(item => {
        const card = createCard(item);
        cardsContainer.appendChild(card);
    });

return clone;
}

// Карточки
function createCard(item) {
    const cardTemplate = document.querySelector('.card-template');
    if (!cardTemplate) {
        console.error("Template with ID 'card-template' not found in the DOM.");
        return document.createElement('div'); // Возвращаем пустой div как запасной вариант
    }
    const clone = cardTemplate.content.cloneNode(true);
    const card = clone.querySelector('.card');
    card.href = window.CONFIG?.getCardUrl(item.slug, item.url_seo_yandex) || `/card/${item.slug}`;
    const img = clone.querySelector('img');
    img.src = item.cover_short;
    img.alt = item.title || 'Image';
    const title = clone.querySelector('.card-title');
    title.textContent = item.title;
    const description = clone.querySelector('.card-description');
    if (item.description) {
        description.textContent = item.description;
        description.hidden = false;
    }
    return clone;
}



// === Кнопка "Наверх" ===
document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopButton = document.querySelector('.button-up');
    
    if (scrollToTopButton) {
        // Показать/скрыть кнопку при скролле
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 500) {
                    scrollToTopButton.classList.add('visible');
                } else {
                    scrollToTopButton.classList.remove('visible');
                }
            }, 10);
        });

        // Обработчик клика - плавный скролл наверх
        scrollToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});