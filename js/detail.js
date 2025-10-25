// Скрипт для страницы деталей

document.addEventListener('DOMContentLoaded', async () => {
    const dataResponse = await fetch('data/data.json');
    const data = await dataResponse.json();
    displayDetail(data);
    
    // Генерация случайной карточки
    const nextBtn = document.querySelector('.detail-footer-container-2 button:last-child');
    if (nextBtn) {
        nextBtn.onclick = () => {
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomSlug = data[randomIndex].slug;
            window.location.href = `detail.html?slug=${randomSlug}`;
        };
    }
});

// Функция для отображения деталей
function displayDetail(data) {
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

    const container = document.getElementById('detail-container-0');
    const template = document.getElementById('detail-template');

    if (!template) {
        console.error('Template not found');
        return;
    }

    const clone = template.content.cloneNode(true);

    // Заполняем данные в шаблоне
    clone.querySelector('.detail-container-image img').src = item.cover;
    clone.querySelector('.detail-container-image img').alt = item.title;
    clone.querySelector('.detail-block1-title').textContent = item.title;
    clone.querySelector('.detail-block1-subtitle').textContent = item.description || '';

    // Заполняем ссылки
    const linksContainer = clone.querySelector('.detail-block2-list');
    const links = [
        { url: item.url_1, title: item.url_title_1 },
        { url: item.url_2, title: item.url_title_2 },
        { url: item.url_3, title: item.url_title_3 },
        { url: item.url_4, title: item.url_title_4 },
        { url: item.url_5, title: item.url_title_5 },
        { url: item.url_6, title: item.url_title_6 }
    ];

    links.forEach(link => {
        if (link.url) {
            const linkElement = document.createElement('a');
            linkElement.className = 'detail-block2-list-item';
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.innerHTML = `
                <div class="lg-regular detail-block2-list-link">${link.title || link.url}</div>
                <div class="md-medium detail-block2-list-icon">↗</div>
            `;
            linksContainer.appendChild(linkElement);
        }
    });

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
    const miscContainer = clone.querySelector('.detail-block4-list');
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
    const aiSummaryBlock = clone.querySelector('.detail-block5');
    if (aiSummaryBlock) {
        aiSummaryBlock.querySelector('.detail-block5-summary').textContent = item.summary_ai || 'Однажды напишет саммари';
    }

    container.appendChild(clone);
}

// Импорт функции для возврата к группе
function goBackToGroup() {
    // Получаем свойства текущей карточки
    const groupSlug = document.querySelector('.group-slug').textContent;
    const subgroupSlug = document.querySelector('.subgroup-slug').textContent;

    // Формируем ссылку с использованием текущего домена
    const url = `${window.location.origin}/group.html?slug=${groupSlug}#${subgroupSlug}`;

    // Переход по ссылке
    window.location.href = url;
}
