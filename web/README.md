# Bibliotechka — web (Vite + React)

Phase 3a scaffold (BIB-4). Visual language from `css/base.css` (Playfair + Inter, day/night). Base UI is used unstyled for Dialog shells (drawer / search).

## Setup

```bash
cd web
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (anon/publishable)
npm install
npm run dev
```

## Routes

| Path | Page |
|------|------|
| `/` | Home (stub) |
| `/:group` | Group (stub) |
| `/card/:seoSlug` | Card detail (stub) |
| `/about` | About (stub) |

Chrome: Header, Footer, ThemeToggle, Drawer, SearchOverlay.

## Next (BIB-5)

- Port full UX + data (build-time JSON from Supabase)
- Card / GroupTile components
- SSG prerender
