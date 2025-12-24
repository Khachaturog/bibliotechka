# Решения для фильтра с дублированными подгруппами

## Проблема

Если подгруппы дублируются с новыми slug (`skill-ui`, `trainer-ui`), то в фильтре они будут отображаться как отдельные пункты:
- "UI" (из skill-ui)
- "UI" (из trainer-ui)

Это создаёт путаницу для пользователя.

---

## Вариант 1: Группировка по базовому названию (рекомендуется)

### Идея
Показывать одно название "UI", но при клике фильтровать по контексту группы.

### Реализация

**В таблице `subgroups` добавить поле `base_slug`:**

```sql
ALTER TABLE subgroups 
ADD COLUMN `base_slug` VARCHAR(255) AFTER `slug`;

-- Заполнить base_slug для дубликатов
UPDATE subgroups 
SET base_slug = SUBSTRING_INDEX(slug, '-', -1)  -- Берём часть после последнего дефиса
WHERE slug LIKE '%-%';
```

**В фильтре группировать по `base_slug`:**

```javascript
// В drawer.js
function getSearchSubgroups(data, subgroupsList, group_slug) {
  const subgroupSlugs = [...new Set(
    data.filter(item => item.group_slug === group_slug)
      .map(item => item.subgroup_slug)
      .filter(Boolean)
  )];
  
  // Группируем по base_slug
  const grouped = {};
  subgroupSlugs.forEach(slug => {
    const subgroup = subgroupsList.find(sg => sg.slug === slug);
    if (subgroup) {
      const baseSlug = subgroup.base_slug || subgroup.slug;
      if (!grouped[baseSlug]) {
        grouped[baseSlug] = {
          base_slug: baseSlug,
          title_ru: subgroup.title_ru,
          slugs: []
        };
      }
      grouped[baseSlug].slugs.push(slug);
    }
  });
  
  return Object.values(grouped);
}
```

**Отображение:**
- Показываем одно название "UI"
- При клике фильтруем по конкретному slug в контексте группы

### Плюсы:
- ✅ Пользователь видит одно название
- ✅ Не перегружает интерфейс
- ✅ Логично для пользователя

### Минусы:
- ⚠️ Нужно добавить поле `base_slug`
- ⚠️ Нужно обновить логику фильтрации

---

## Вариант 2: Показывать с префиксом группы

### Идея
Показывать "UI (Навыки)" и "UI (Тренажёры)".

### Реализация

```javascript
function getSearchSubgroups(data, subgroupsList, group_slug) {
  // ... получаем подгруппы ...
  
  subgroups.forEach(subgroup => {
    const badge = badgeTemplate.content.firstElementChild.cloneNode(true);
    const groupInfo = groupList.find(g => g.slug === group_slug);
    const groupTitle = groupInfo ? groupInfo.title_ru : group_slug;
    
    // Если slug содержит дефис, показываем с префиксом группы
    if (subgroup.slug.includes('-')) {
      badge.textContent = `${subgroup.title_ru} (${groupTitle})`;
    } else {
      badge.textContent = subgroup.title_ru;
    }
    // ...
  });
}
```

### Плюсы:
- ✅ Понятно, к какой группе относится
- ✅ Простая реализация

### Минусы:
- ⚠️ Длинные названия в фильтре
- ⚠️ Может перегружать интерфейс

---

## Вариант 3: Хранить оригинальный slug отдельно

### Идея
В таблице `subgroups` хранить:
- `slug` — уникальный (`skill-ui`)
- `original_slug` — базовый (`ui`)
- `group_slug` — привязка к группе

### Структура:

```sql
CREATE TABLE `subgroups` (
  `slug` VARCHAR(255) PRIMARY KEY,        -- "skill-ui"
  `original_slug` VARCHAR(255),            -- "ui" (для группировки)
  `group_slug` VARCHAR(255) NOT NULL,
  `title_ru` VARCHAR(255) NOT NULL,
  `description_ru` TEXT,
  `sort` INT DEFAULT 0,
  ...
);
```

**В фильтре группировать по `original_slug`:**

```javascript
// Группируем подгруппы с одинаковым original_slug
const grouped = {};
subgroups.forEach(subgroup => {
  const key = subgroup.original_slug || subgroup.slug;
  if (!grouped[key]) {
    grouped[key] = {
      title: subgroup.title_ru,
      items: []
    };
  }
  grouped[key].items.push(subgroup);
});
```

### Плюсы:
- ✅ Явное разделение уникального и базового slug
- ✅ Гибкость в отображении

### Минусы:
- ⚠️ Дополнительное поле в БД
- ⚠️ Нужно заполнять при создании

---

## Вариант 4: Умная группировка на клиенте

### Идея
Автоматически определять базовое название по паттерну slug.

### Реализация

```javascript
function extractBaseSlug(slug) {
  // Если slug содержит дефис, берём часть после последнего дефиса
  if (slug.includes('-')) {
    const parts = slug.split('-');
    // Пропускаем первую часть (group_slug), берём остальное
    return parts.slice(1).join('-');
  }
  return slug;
}

function getSearchSubgroups(data, subgroupsList, group_slug) {
  const subgroupSlugs = [...new Set(
    data.filter(item => item.group_slug === group_slug)
      .map(item => item.subgroup_slug)
  )];
  
  // Группируем по базовому slug
  const grouped = new Map();
  
  subgroupSlugs.forEach(slug => {
    const subgroup = subgroupsList.find(sg => sg.slug === slug);
    if (subgroup) {
      const baseSlug = extractBaseSlug(slug);
      if (!grouped.has(baseSlug)) {
        grouped.set(baseSlug, {
          baseSlug,
          title: subgroup.title_ru,
          slugs: []
        });
      }
      grouped.get(baseSlug).slugs.push(slug);
    }
  });
  
  return Array.from(grouped.values());
}
```

### Плюсы:
- ✅ Не требует изменений в БД
- ✅ Работает автоматически

### Минусы:
- ⚠️ Зависит от формата slug (если формат изменится, сломается)
- ⚠️ Может быть неточным для сложных случаев

---

## Рекомендация

**Использовать Вариант 1 или Вариант 3** — добавить поле `base_slug` или `original_slug` в таблицу `subgroups`.

Это даст:
1. Явное разделение уникального и базового slug
2. Гибкость в отображении
3. Возможность группировать в фильтре
4. Возможность показывать контекст при необходимости

### Пример структуры:

```sql
CREATE TABLE `subgroups` (
  `slug` VARCHAR(255) PRIMARY KEY,        -- "skill-ui" (уникальный)
  `base_slug` VARCHAR(255),                -- "ui" (для группировки)
  `group_slug` VARCHAR(255) NOT NULL,      -- "skill"
  `title_ru` VARCHAR(255) NOT NULL,        -- "UI"
  `description_ru` TEXT,                    -- Описание в контексте группы
  `sort` INT DEFAULT 0,
  ...
);
```

### В фильтре:

```javascript
// Группируем по base_slug, показываем одно название
// При клике используем конкретный slug для фильтрации
```

---

## Пример отображения в фильтре

### С группировкой:
```
📁 Навыки
  [UI] [UX] [Курсы] [Инструменты]

📁 Тренажёры  
  [UI] [Шрифты] [Цвет]
```

Оба "UI" будут отображаться одинаково, но при клике будут фильтровать по разным slug (`skill-ui` и `trainer-ui`).

