# Changelog - Таблица `card_authors`

## [2025-12-09] - Первоначальная версия

### Создано
- Таблица `card_authors` создана
- Связующая таблица для связи карточек и авторов (many-to-many)
- Составной PRIMARY KEY на (`card_slug`, `author_slug`)
- Внешние ключи на таблицы `data` и `authors` с CASCADE удалением
- Индексы для оптимизации запросов
- Автоматический timestamp: `created_at_db`

### Структура
- `card_slug` - ссылка на карточку из таблицы `data` (часть PRIMARY KEY)
- `author_slug` - ссылка на автора из таблицы `authors` (часть PRIMARY KEY)
- Составной PRIMARY KEY предотвращает дублирование связей

