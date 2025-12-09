// Переключение темы
function toggleTheme() {
    const body = document.body;
    const switchers = document.querySelectorAll('.switcher-theme');
    // Определяем текущую тему
    const isNight = body.classList.contains('night') || body.classList.contains('dark-theme');
    if (isNight) {
        // Переключаем на день
        body.classList.remove('night', 'dark-theme');
        body.classList.add('day');
        switchers.forEach(switcher => {
            switcher.classList.add('theme-day-active');
            switcher.classList.remove('theme-night-active');
        });
        localStorage.setItem('theme', 'light');
    } else {
        // Переключаем на ночь
        body.classList.remove('day');
        body.classList.add('night', 'dark-theme');
        switchers.forEach(switcher => {
            switcher.classList.add('theme-night-active');
            switcher.classList.remove('theme-day-active');
        });
        localStorage.setItem('theme', 'dark');
    }
}


// Устанавливаем тему при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const switchers = document.querySelectorAll('.switcher-theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        body.classList.remove('day', 'night');
        body.classList.add('night');
        switchers.forEach(switcher => {
            switcher.classList.add('theme-night-active');
            switcher.classList.remove('theme-day-active');
        });
    } else {
        body.classList.remove('dark-theme', 'night');
        body.classList.add('day');
        switchers.forEach(switcher => {
            switcher.classList.add('theme-day-active');
            switcher.classList.remove('theme-night-active');
        });
    }
}
);

// Вызов меню
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const btn = document.getElementById('menu-toggle');
    const body = document.body;
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('drawer-open');
    if (isOpen) {
        body.classList.add('drawer-open');
    } else {
        body.classList.remove('drawer-open');
    }
}


// Функция для переключения поиска
function toggleSearch() {
    const search = document.getElementById('search');
    const btn = document.getElementById('search-toggle');
    const body = document.body;
    const isOpen = search.classList.toggle('open');
    btn.classList.toggle('search-open');
    if (isOpen) {
        body.classList.add('search-open');
    } else {
        body.classList.remove('search-open');
    }
}

// Получить уникальные группы для поиска
function getSearchGroups(data) {
  const groupMap = new Map();
  data.forEach(item => {
    if (!groupMap.has(item.group_slug)) {
      groupMap.set(item.group_slug, { group: item.group, group_slug: item.group_slug });
    }
  });
  return Array.from(groupMap.values());
}

// Получить уникальные подгруппы для группы (с title)
function getSearchSubgroups(data, subgroupsList, group_slug) {
  // Получаем уникальные slug подгрупп для группы
  const subgroupSlugs = [...new Set(data.filter(item => item.group_slug === group_slug).map(item => item.subgroup_slug).filter(Boolean))];
  // Для каждого slug ищем объект с title
  return subgroupSlugs.map(slug => {
    const found = subgroupsList.find(sg => sg.slug === slug);
    return found ? found : { slug, title: slug };
  });
}

// Основная функция наполнения поиска
async function fillSearchGroupsAndSubgroups() {
  const badgeWrap = document.querySelector('.search-badge-wrap');
  const groupTemplate = document.querySelector('template.search-group-block');
  const badgeTemplate = document.querySelector('template.search-badge-template');
  if (!badgeWrap || !groupTemplate || !badgeTemplate) return;
  badgeWrap.innerHTML = '';
  try {
    const [dataResponse, subgroupsResponse, groupsResponse] = await Promise.all([
      fetch('data/data.json'),
      fetch('data/subgroup.json'),
      fetch('data/group.json')
    ]);
    const data = await dataResponse.json();
    const subgroupsList = await subgroupsResponse.json();
    const groupList = await groupsResponse.json();
    const groups = getSearchGroups(data);
    groups.forEach(group => {
      const subgroups = getSearchSubgroups(data, subgroupsList, group.group_slug);
      const groupBlock = groupTemplate.content.cloneNode(true);
      // Заголовок
      const groupTitle = groupBlock.querySelector('.group-title');
      const groupInfo = groupList.find(g => g.slug === group.group_slug);
      if (groupTitle) {
        groupTitle.textContent = groupInfo ? groupInfo.title : group.group;
        groupTitle.style.display = 'block';
      }
      // Бейджи
      const badgesDiv = groupBlock.querySelector('.subgroup-badges');
      badgesDiv.innerHTML = '';
      subgroups.forEach(subgroup => {
        const badge = badgeTemplate.content.firstElementChild.cloneNode(true);
        badge.href = `group.html?slug=${group.group_slug}#${subgroup.slug}`;
        badge.textContent = subgroup.title;
        // Закрываем поиск перед переходом
        badge.addEventListener('click', (e) => {
          const search = document.getElementById('search');
          if (search && search.classList.contains('open')) {
            e.preventDefault();
            toggleSearch();
            // Выполняем переход после закрытия поиска
            setTimeout(() => {
              window.location.href = `group.html?slug=${group.group_slug}#${subgroup.slug}`;
            }, 100);
          }
        });
        badgesDiv.appendChild(badge);
      });
      badgeWrap.appendChild(groupBlock);
    });
  } catch (e) {
    badgeWrap.textContent = 'Ошибка загрузки групп';
  }
}

document.addEventListener('DOMContentLoaded', fillSearchGroupsAndSubgroups);

