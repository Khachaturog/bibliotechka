# Bibliotechka — web (Vite + React)

Phase 3a scaffold (BIB-4). Visual language from `css/base.css` (Playfair + Inter, day/night). Base UI is used unstyled for Dialog shells (drawer / search).

## Setup

```bash
cd web
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (anon/publishable)
npm install
npm run fetch-content  # optional refresh of src/generated/*.json
npm run dev
```

`prebuild` refreshes JSON when env is set; otherwise committed `src/generated/` is used.

## Routes

| Path | Page |
|------|------|
| `/` | Home — groups + shuffled cards |
| `/:group` | Group — badges, scroll-spy, copy-link |
| `/card/:seoSlug` | Card detail |
| `/about` | Versions |

Chrome: Header, Footer, ThemeToggle, Drawer, SearchOverlay (group→subgroup chips).

## Next (BIB-6)

SSG prerender of all URLs.
