# Статистика пересечений подгрупп между группами

## 🔴 Подгруппы, используемые в нескольких группах (требуют дублирования)

### 1. `other` - используется в **6 группах**
- **books**: 13 карточек
- **community**: 1 карточка
- **designsystem**: 9 карточек
- **reference**: 41 карточка
- **resource**: 3 карточки
- **trainer**: 2 карточки

**Решение:** Создать дубликаты:
- `books-other`
- `community-other`
- `designsystem-other`
- `reference-other`
- `resource-other`
- `trainer-other`

---

### 2. `color` - используется в **3 группах**
- **books**: 1 карточка
- **resource**: 4 карточки
- **trainer**: 6 карточек

**Решение:** Создать дубликаты:
- `books-color`
- `resource-color`
- `trainer-color`

---

### 3. `knowledge` - используется в **3 группах**
- **life**: 1 карточка
- **resource**: 5 карточек
- **skill**: 16 карточек

**Решение:** Создать дубликаты:
- `life-knowledge`
- `resource-knowledge`
- `skill-knowledge`

---

### 4. `text` - используется в **2 группах**
- **designsystem**: 14 карточек
- **resource**: 3 карточки

**Решение:** Создать дубликаты:
- `designsystem-text`
- `resource-text`

---

### 5. `ui` - используется в **2 группах**
- **skill**: 5 карточек
- **trainer**: 4 карточки

**Решение:** Создать дубликаты:
- `skill-ui`
- `trainer-ui`

---

### 6. `figma-code` - используется в **2 группах**
- **designsystem**: 1 карточка
- **reference**: 7 карточек

**Решение:** Создать дубликаты:
- `designsystem-figma-code`
- `reference-figma-code`

---

### 7. `ux` - используется в **2 группах**
- **reference**: 1 карточка
- **skill**: 11 карточек

**Решение:** Создать дубликаты:
- `reference-ux`
- `skill-ux`

---

### 8. `fonts` - используется в **2 группах**
- **resource**: 20 карточек
- **trainer**: 7 карточек

**Решение:** Создать дубликаты:
- `resource-fonts`
- `trainer-fonts`

---

### 9. `tool` - используется в **2 группах**
- **resource**: 10 карточек
- **trainer**: 4 карточки

**Решение:** Создать дубликаты:
- `resource-tool`
- `trainer-tool`

---

### 10. `accessibility` - используется в **2 группах**
- **designsystem**: 7 карточек
- **resource**: 2 карточки

**Решение:** Создать дубликаты:
- `designsystem-accessibility`
- `resource-accessibility`

---

### 11. `animation` - используется в **2 группах**
- **reference**: 7 карточек
- **skill**: 6 карточек

**Решение:** Создать дубликаты:
- `reference-animation`
- `skill-animation`

---

### 12. `darkpattern` - используется в **2 группах**
- **reference**: 2 карточки
- **skill**: 1 карточка

**Решение:** Создать дубликаты:
- `reference-darkpattern`
- `skill-darkpattern`

---

### 13. `mobile` - используется в **2 группах**
- **designsystem**: 3 карточки
- **reference**: 1 карточка

**Решение:** Создать дубликаты:
- `designsystem-mobile`
- `reference-mobile`

---

### 14. `game` - используется в **2 группах**
- **reference**: 1 карточка
- **trainer**: 2 карточки

**Решение:** Создать дубликаты:
- `reference-game`
- `trainer-game`

---

### 15. `industrial` - используется в **2 группах**
- **books**: 1 карточка
- **community**: 4 карточки

**Решение:** Создать дубликаты:
- `books-industrial`
- `community-industrial`

---

## 📊 Статистика по группам

| Группа | Количество подгрупп | Подгруппы |
|--------|---------------------|-----------|
| **reference** | 16 | animation, app, darkpattern, dataviz, dribble-arena-pinterest, figma-code, game, illustration, mobbin, mobile, newsletter, other, paywall, saas, ux, web |
| **designsystem** | 15 | accessibility, apple, blueprint, branding, collection, demo, ds, figma-code, kit, material, mobile, other, sdui, text, windows |
| **resource** | 14 | 3d, accessibility, ai, color, course, fonts, graphic, icon, knowledge, other, photo, plugin, text, tool |
| **skill** | 13 | animation, darkpattern, design-process, foundation, hiring, knowledge, metric, portfolio, skillset, test, ui, ux, whiteboard |
| **trainer** | 12 | attention, brainstorm, brief, color, contest, fonts, game, other, playground, teambuilding, tool, ui |
| **books** | 9 | basic, catalog, color, editor, guidelines, industrial, interface, layout, other |
| **community** | 5 | blog, event, industrial, other, survey |
| **life** | 4 | documentary, food, health, knowledge |

---

## ✅ Итого

**Всего подгрупп с пересечениями:** 15

**Требуется создать дубликатов:** ~30 новых записей в таблице `subgroups`

**Рекомендация:** При создании дубликатов используйте формат slug: `{group_slug}-{subgroup_slug}`

Например:
- `books-other`
- `skill-ui`
- `designsystem-text`
- и т.д.

