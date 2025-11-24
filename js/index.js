// Скрипт для главной страницы

document.addEventListener('DOMContentLoaded', async () => {
    const [dataResponse, groupsResponse] = await Promise.all([
        fetch('data/data.json'),
        fetch('data/group.json')
    ]);
    const data = await dataResponse.json();
    let groups = await groupsResponse.json();
    // Сортировка групп по свойству sort
    groups = groups.slice().sort((a, b) => a.sort - b.sort);
    displayGroups(groups);
    displayCards(data); // включаем обычную отрисовку всех карточек
});

// Функция для отображения групп
function displayGroups(groups) {
    const container = document.querySelector('.groups-container');
    const template = document.querySelector('.group-template');

    groups.forEach(group => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group');
        const img = clone.querySelector('.group-cover');
        const title = clone.querySelector('.group-title');
        const description = clone.querySelector('.group-description');

        card.href = `group.html?slug=${group.slug}`;
        img.src = group.cover;
        img.alt = group.title;
        title.textContent = group.title;

        if (group.description) {
            description.textContent = group.description;
            description.hidden = false;
        }

        container.appendChild(clone);
    });
}

// Функция для перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Функция для отображения карточек
function displayCards(data) {
    const container = document.querySelector('.cards-container');
    const template = document.querySelector('.card-template');

    if (!container || !template) {
        console.error('Container or template not found');
        return;
    }

    // Фильтруем карточки только со статусом "published"
    const publishedData = data.filter(item => item.status_slug === 'published');

    // Перемешиваем карточки
    shuffleArray(publishedData);

    publishedData.forEach(item => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        const img = clone.querySelector('.card-cover');
        const title = clone.querySelector('.card-title');
        const description = clone.querySelector('.card-description');

        card.href = `detail.html?slug=${item.slug}`;
        img.src = item.cover;
        img.alt = item.title;
        title.textContent = item.title;

        if (item.description) {
            description.textContent = item.description;
            description.hidden = false;
        } else {
            description.hidden = true;
        }

        container.appendChild(clone);
    });
}

