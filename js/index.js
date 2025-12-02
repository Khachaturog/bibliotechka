// Скрипт для главной страницы

// Правило 300/500: задержка перед показом скелетонов и минимальное время показа
const SKELETON_DELAY = 300;
const SKELETON_MIN_DISPLAY = 500;

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
    
    // Загружаем данные
    const [dataResponse, groupsResponse] = await Promise.all([
        fetch('data/data.json'),
        fetch('data/group.json')
    ]);

    const data = await dataResponse.json();
    const groups = await groupsResponse.json();
    
    // Отменяем таймер, если данные пришли быстро
    clearTimeout(skeletonTimer);
    
    // Если скелетоны были показаны, ждём минимум 500ms
    if (skeletonsShown) {
        const elapsed = Date.now() - skeletonsShownAt;
        if (elapsed < SKELETON_MIN_DISPLAY) {
            await new Promise(resolve => setTimeout(resolve, SKELETON_MIN_DISPLAY - elapsed));
        }
    }

    // Сортировка групп по свойству sort
    const sortedGroups = groups.slice().sort((a, b) => a.sort - b.sort);

    displayGroups(sortedGroups);
    displayCards(data);
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

    // Фильтруем только опубликованные карточки
    const publishedCards = data.filter(item => item.status_slug === 'published');

    // Перемешиваем карточки
    shuffleArray(publishedCards);

    publishedCards.forEach(item => {
        const clone = template.content.cloneNode(true);

        const card = clone.querySelector('.card');
        const img = clone.querySelector('.card-cover');
        const title = clone.querySelector('.card-title');
        const description = clone.querySelector('.card-description');

        card.href = `detail.html?slug=${item.slug}`;
        img.src = item.cover;
        img.alt = item.title;
        title.textContent = item.title;

        description.textContent = item.description || '';
        description.hidden = !item.description;

        container.appendChild(clone);
    });
}