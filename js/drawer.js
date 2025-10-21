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
)