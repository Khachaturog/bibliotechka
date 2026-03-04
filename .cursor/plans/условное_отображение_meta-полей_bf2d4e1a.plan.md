---
name: Условное отображение meta-полей
overview: Показывать строки «Проведено» и «Статья опубликована» только когда у них есть реальные данные, а не прочерки.
todos: []
isProject: false
---

# Условное отображение meta-полей (161–162)

## Цель

Строки «Проведено» и «Статья опубликована» показывать только при наличии данных. При значении `-` или пустом — скрывать.

## Подход

В [js/detail.js](js/detail.js) после заполнения meta-блока: если данные равны `-` или пустые, вешать класс `detail-meta-row--empty`. В CSS скрывать элементы с этим классом.

## Изменения

### 1. CSS — [css/base.css](css/base.css)

Добавить правило (после `.detail-meta-row span:last-child`):

```css
.detail-meta-row--empty {
  display: none;
}
```

### 2. JS — [js/detail.js](js/detail.js)

После блока с `miscContainer.querySelector(...)` (после строки 324) добавить:

```javascript
        // Скрываем строки без данных (прочерки)
        const hasDates = (item.start_date && item.start_date !== '-') || (item.end_date && item.end_date !== '-');
        const datesRow = miscContainer.querySelector('.start-date')?.closest('.detail-meta-row');
        if (datesRow && !hasDates) datesRow.classList.add('detail-meta-row--empty');

        const hasPublished = item.published && item.published !== '-';
        const publishedRow = miscContainer.querySelector('.published')?.closest('.detail-meta-row');
        if (publishedRow && !hasPublished) publishedRow.classList.add('detail-meta-row--empty');
```

## Логика

- **Проведено**: показывать, если есть `start_date` или `end_date`, и они не `-`.
- **Статья опубликована**: показывать, если есть `published` и он не `-`.

## Откат

- Удалить правило `.detail-meta-row--empty` из CSS.
- Удалить добавленный блок JS.
