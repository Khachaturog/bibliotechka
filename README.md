# Библиотечка

Коллекция материалов для дизайнеров: ресурсы, дизайн-системы, насмотренность, книги и многое другое.

Сайт: **https://bibliotechka.site**

## Стек

- **Frontend:** Vite + React + TypeScript + React Router + [Base UI](https://base-ui.com) + Lucide
- **Данные:** Supabase Postgres (публичный read / RLS); каталог вшивается в билд
- **SEO:** SSG-пререндер на `npm run build`
- **Деплой:** GitHub Pages (`web/dist`), custom domain `bibliotechka.site` (`web/public/CNAME`)

Старый PHP/FTP стек лежит в [`archive/php-legacy/`](archive/php-legacy/) (не удаляем).

## Быстрый старт

```bash
cd web
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run fetch-content
npm run dev
```

Сборка (fetch + Vite + prerender):

```bash
cd web && npm run build
```

`VITE_BASE=/` — корневой URL (custom domain / user Pages root).  
Репозиторий на GitHub может по-прежнему называться `bibliotechka-4`; имя репо ≠ path на custom domain.

## Структура

```
web/                 # Vite React app
supabase/            # schema + RLS notes
archive/php-legacy/  # прежний PHP/admin/api/css/js
.github/workflows/   # Pages (+ legacy FTP until DNS cutover)
```
