---
name: Скрытие блока summary
overview: Скрыть блок «Библиотечка AI» с summary через CSS, оставив возможность быстро вернуть его при появлении данных.
todos: []
isProject: false
---

# Скрытие блока summary с возможностью возврата

## Подход

Использовать CSS для скрытия — HTML и JS трогать не нужно. При появлении summary-данных потребуется снять одно правило.

## Изменения

**Файл:** [css/base.css](css/base.css)

В правиле `.detail-ai` (строка 1767) временно скрыть блок:

```css
.detail-ai {
  display: none;  /* TODO: убрать когда появятся summary по сайтам */
  /* display: grid; */
  /* gap: 2px; */
}
```

Текущее правило:

```1767:1770:css/base.css
.detail-ai {
  display: grid;
  gap: 2px;
}
```

## Возврат в будущем

Когда появятся данные summary:

1. В [css/base.css](css/base.css) в `.detail-ai` удалить строку `display: none` и раскомментировать `display: grid` и `gap: 2px`.
2. HTML в [detail.html](detail.html) и логика в [js/detail.js](js/detail.js) (строки 328–330) уже готовы к отображению summary, менять ничего не потребуется.

