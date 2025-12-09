// Скрипт для страницы деталей

document.addEventListener('DOMContentLoaded', async () => {
    const [dataResponse, groupsResponse, subgroupsResponse] = await Promise.all([
        fetch('data/data.json'),
        fetch('data/group.json'),
        fetch('data/subgroup.json')
    ]);
    const data = await dataResponse.json();
    const groups = await groupsResponse.json();
    const subgroups = await subgroupsResponse.json();
    displayDetail(data, groups, subgroups);
    
    // Функция для перехода к случайной карточке
    window.getRandomCardRedirect = function() {
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomSlug = data[randomIndex].slug;
        window.location.href = `detail.html?slug=${randomSlug}`;
    };
    
        // Функция поделиться
        window.shareCard = function() {
            const url = window.location.href;
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
    const url = `${window.location.origin}/group.html?slug=${groupSlug}`;
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
        const url = `${window.location.origin}/group.html?slug=${groupSlug}#${subgroupSlug}`;
        window.location.href = url;
    }
}

// Функция для отображения деталей
function displayDetail(data, groups, subgroups) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) {
        document.body.innerHTML = '<h1>Материал не найден (slug не указан)</h1>';
        return;
    }

    const item = data.find(item => {
        const itemSlugNum = parseInt(item.slug);
        const searchSlugNum = parseInt(slug);
        return item.slug === slug || itemSlugNum === searchSlugNum;
    });

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
    badgeTitles[0].textContent = group ? group.title : item.group_slug || '';
    badgeTitles[0].closest('button').onclick = () => navigateToGroupFromBreadcrumb(item.group_slug);
    
    // Вторая кнопка - subgroup
    const subgroup = subgroups.find(s => s.slug === item.subgroup_slug);
    badgeTitles[1].textContent = subgroup ? subgroup.title : item.subgroup_slug || '';
    badgeTitles[1].closest('button').onclick = () => navigateToSubgroupFromBreadcrumb(item.group_slug, item.subgroup_slug);

    container.appendChild(clone);
}

