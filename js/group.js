// Скрипт для страницы групп

document.addEventListener('DOMContentLoaded', async () => {
        const [dataResponse, groupsResponse, subgroupsResponse] = await Promise.all([
                fetch('data/data.json'),
                fetch('data/group.json'),
                fetch('data/subgroup.json')
        ]);
        const data = await dataResponse.json();
        const groups = await groupsResponse.json();
        const subgroups = await subgroupsResponse.json();
        const params = new URLSearchParams(window.location.search);
        const groupSlug = params.get('slug');
        const group = groups.find(g => g.slug === groupSlug);
        if (group) {
                document.querySelector('.container-title').textContent = group.title;
                document.querySelector('.container-description').textContent = group.description || '';

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

                const filteredData = data.filter(item => item.group_slug === groupSlug);
                displaySubgroupsAndCards(filteredData, subgroups);
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
        }
});

// displaySubgroupsAndCards
function displaySubgroupsAndCards(data, subgroups) {
    const container = document.querySelector('.subgroups-wrap');
    container.innerHTML = ''; // Clear existing content

    const subgroupsContainer = document.querySelector('.badge-wrap');
    subgroupsContainer.innerHTML = ''; // Clear existing badges

    subgroups.forEach(subgroup => {
        const subgroupData = data.filter(item => item.subgroup_slug === subgroup.slug);
        if (subgroupData.length > 0) {
            const badge = createBadge(subgroup);
            subgroupsContainer.appendChild(badge);

            const subgroupElement = createSubgroup(subgroup, subgroupData);
            container.appendChild(subgroupElement);
        }
    });
}

// Бейджи
const badgeTemplate = document.getElementById('badge-template');

function createBadge(subgroup) {
    const clone = badgeTemplate.content.cloneNode(true);
    const badge = clone.querySelector('.badge');
    badge.href = `#${subgroup.slug}`;
    badge.querySelector('.badge-title').textContent = subgroup.title;

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
            history.pushState(null, null, `#${subgroup.slug}`);

            // Устанавливаем класс active для текущего бейджа с задержкой
            setTimeout(() => {
                document.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
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
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            const targetId = badge.getAttribute('href').substring(1);
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
    }, 10); // Задержка 10мс после завершения прокрутки
});



// Подгруппы
const subgroupTemplate = document.getElementById('subgroup-template');

function createSubgroup(subgroup, subgroupData) {
    const clone = subgroupTemplate.content.cloneNode(true);
    const subgroupElement = clone.querySelector('.cards-container-0');
    subgroupElement.id = subgroup.slug;

    const title = clone.querySelector('.container-title');
    title.textContent = subgroup.title;

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
    if (subgroup.description) {
        const description = clone.querySelector('.container-description');
        description.textContent = subgroup.description;
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
    card.href = `detail.html?slug=${item.slug}`;
    const img = clone.querySelector('img');
    img.src = item.cover;
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