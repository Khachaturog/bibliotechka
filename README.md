# Библиотечка

Коллекция материалов для дизайнеров: ресурсы, дизайн-системы, насмотренность, книги и многое другое.

Сайт: **https://bibliotechka.site**

## Стек

- **Frontend:** Vite + React + TypeScript + React Router + [Base UI](https://base-ui.com) + Lucide
- **Данные:** Supabase Postgres (публичный read / RLS); каталог вшивается в билд
- **SEO:** SSG-пререндер на `npm run build`
- **Деплой:** GitHub Pages (`web/dist`), custom domain `bibliotechka.site` (`web/public/CNAME`)

Старый PHP/FTP стек удалён (BIB-8). Живой деплой — только GitHub Pages.

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

Preview: `https://khachaturog.github.io/bibliotechka/` (`VITE_BASE=/bibliotechka/`).  
После DNS cutover на `bibliotechka.site` — `VITE_BASE=/`.

## Структура

```
web/                 # Vite React app
supabase/            # schema + RLS notes
.github/workflows/   # pages.yml (live), deploy.yml (FTP disabled)
```
