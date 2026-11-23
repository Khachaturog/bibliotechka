# Supabase (Bibliotechka)

Postgres schema + MySQL import for the React/SSG migration (phase 1).

## Files

- `schema.sql` — tables from `database/init.sql` (Postgres `text` types) + RLS
- `../scripts/import-mysql-to-supabase.py` — MySQL → Supabase import

## RLS

| Role | Access |
|------|--------|
| `anon` / `authenticated` | `SELECT` only |
| `data` | only rows with `status_slug = 'published'` |
| writes | service role / Dashboard only (no write policies) |

Cover path rewrites (`cover_short` / `cover_large`) wait until covers land in the repo.

## Apply schema (Dashboard)

1. Open project → **SQL Editor**
2. Paste and run all of `schema.sql`
3. Confirm tables exist under **Table Editor**

## Import from Jino MySQL

Do **not** commit passwords or service keys.

```bash
export MYSQL_HOST=...
export MYSQL_PORT=3306
export MYSQL_USER=...
export MYSQL_PASSWORD=...
export MYSQL_DATABASE=...

# Preferred: Database → Connection string (URI), then:
export SUPABASE_DB_URL='postgresql://postgres....'
export APPLY_SCHEMA=1          # optional if schema not applied yet
export VERIFY_ANON=1
export SUPABASE_URL='https://….supabase.co'
export SUPABASE_ANON_KEY='…'   # publishable / anon key

python3 scripts/import-mysql-to-supabase.py
```

Alternatively, after schema is applied, use the **service_role** key:

```bash
export SUPABASE_URL='https://….supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='…'
python3 scripts/import-mysql-to-supabase.py
```

## Verify (anon)

```bash
curl -s "$SUPABASE_URL/rest/v1/data?select=slug,status_slug&status_slug=eq.draft&limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
# expect []

curl -s "$SUPABASE_URL/rest/v1/data?select=slug,status_slug&limit=3" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
# expect status_slug=published only
```

MySQL source counts (reference): groups 9, subgroups 99, versions 17, authors 579, data 649 (623 published / 26 draft), card_authors 723.
