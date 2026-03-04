// Скрипт для страницы «О проекте» с историей версий

// Конфигурация API
const ABOUT_API_BASE = window.CONFIG?.API_BASE || '/api/v1';

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function formatDateToRussian(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
    const d = new Date(dateStr.trim());
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = MONTHS_RU[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('versions-container');
    const skeletons = document.getElementById('versions-skeletons');
    const errorBlock = document.getElementById('versions-error');
    const countElement = document.getElementById('versions-count');
    const template = document.querySelector('.version-template');

    if (!container || !template) {
        console.error('Контейнер или шаблон версий не найден');
        return;
    }

    // Скрываем ошибку на всякий случай
    if (errorBlock) errorBlock.hidden = true;

    try {
        const response = await fetch(
            window.CONFIG?.getApiUrl('versions/list') ||
            `${ABOUT_API_BASE}/versions/list`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const versions = await response.json();

        // Убираем скелетоны
        if (skeletons) {
            skeletons.remove();
        }

        // Обновляем счётчик
        if (countElement) {
            countElement.textContent = versions.length ? versions.length : '';
        }

        displayVersions(versions, container, template);
    } catch (error) {
        console.error('Ошибка загрузки версий:', error);
        if (skeletons) {
            skeletons.remove();
        }
        if (errorBlock) {
            errorBlock.hidden = false;
        }
    }
});

function displayVersions(versions, container, template) {
    if (!Array.isArray(versions) || versions.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'md-regular';
        empty.textContent = 'Пока здесь пусто, но скоро появятся первые релизы.';
        container.appendChild(empty);
        return;
    }

    versions.forEach((item) => {
        const clone = template.content.cloneNode(true);

        const label = clone.querySelector('.version-label');
        const title = clone.querySelector('.version-title');
        const date = clone.querySelector('.version-date');
        const description = clone.querySelector('.version-description');
        const link = clone.querySelector('.version-link');

        if (label) {
            label.textContent = item.version ? `Версия ${item.version}` : '';
            label.hidden = !item.version;
        }

        if (title) {
            title.textContent = item.title || '';
            title.hidden = !item.title;
        }

        if (date) {
            date.textContent = item.release_date ? formatDateToRussian(item.release_date) : '';
            date.hidden = !item.release_date;
        }

        if (description) {
            description.textContent = item.description || '';
            description.hidden = !item.description;
        }

        if (link) {
            if (item.url) {
                link.href = item.url;
                link.textContent = 'Подробнее';
                link.hidden = false;
            } else {
                link.hidden = true;
            }
        }

        container.appendChild(clone);
    });
}

