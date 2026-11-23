#!/usr/bin/env python3
"""
Import Bibliotechka tables from Jino MySQL into Supabase Postgres.

Requires env (do not commit values):
  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
  and one of:
    SUPABASE_DB_URL          # postgres connection string (preferred for DDL+import)
    SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL  # REST upsert after schema already applied

Optional:
  APPLY_SCHEMA=1             # run supabase/schema.sql via SUPABASE_DB_URL first
  VERIFY_ANON=1              # spot-check RLS with SUPABASE_ANON_KEY (or publishable key)

Usage:
  python3 scripts/import-mysql-to-supabase.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

try:
    import pymysql
except ImportError:
    print("Missing pymysql. Install: pip3 install pymysql", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "supabase" / "schema.sql"

TABLES = [
    "groups",
    "subgroups",
    "versions",
    "authors",
    "data",
    "card_authors",
]

# Upsert conflict targets
CONFLICT = {
    "groups": "slug",
    "subgroups": "slug",
    "versions": "slug",
    "authors": "slug",
    "data": "slug",
    "card_authors": "card_slug,author_slug",
}


def env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def require_mysql() -> dict[str, Any]:
    missing = [
        n
        for n in ("MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE")
        if not env(n)
    ]
    if missing:
        print(f"Missing MySQL env: {', '.join(missing)}", file=sys.stderr)
        sys.exit(2)
    return {
        "host": env("MYSQL_HOST"),
        "port": int(env("MYSQL_PORT", "3306") or "3306"),
        "user": env("MYSQL_USER"),
        "password": env("MYSQL_PASSWORD"),
        "database": env("MYSQL_DATABASE"),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "connect_timeout": 30,
    }


def serialize_row(row: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in row.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat(sep=" ")
        else:
            out[k] = v
    return out


def fetch_mysql() -> dict[str, list[dict[str, Any]]]:
    conn = pymysql.connect(**require_mysql())
    data: dict[str, list[dict[str, Any]]] = {}
    try:
        with conn.cursor() as cur:
            for table in TABLES:
                cur.execute(f"SELECT * FROM `{table}`")
                data[table] = [serialize_row(r) for r in cur.fetchall()]
                print(f"MySQL {table}: {len(data[table])} rows")
    finally:
        conn.close()
    return data


def apply_schema_psql(db_url: str) -> None:
    import subprocess

    if not SCHEMA_PATH.is_file():
        print(f"Schema not found: {SCHEMA_PATH}", file=sys.stderr)
        sys.exit(2)
    print(f"Applying schema via psql: {SCHEMA_PATH}")
    # Prefer Homebrew libpq if on PATH issues
    psql = "psql"
    brew_psql = "/opt/homebrew/Cellar/libpq/18.1/bin/psql"
    if Path(brew_psql).exists():
        psql = brew_psql
    r = subprocess.run(
        [psql, db_url, "-v", "ON_ERROR_STOP=1", "-f", str(SCHEMA_PATH)],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        print(r.stdout)
        print(r.stderr, file=sys.stderr)
        sys.exit(r.returncode)
    print("Schema applied.")


def import_via_psql(db_url: str, tables: dict[str, list[dict[str, Any]]]) -> None:
    import subprocess

    psql = "psql"
    brew_psql = "/opt/homebrew/Cellar/libpq/18.1/bin/psql"
    if Path(brew_psql).exists():
        psql = brew_psql

    # Disable FK checks during load by deferring constraints where possible;
    # truncate in reverse dependency order then insert in forward order.
    reverse = list(reversed(TABLES))
    sql_parts = ["BEGIN;", "SET session_replication_role = replica;"]
    for table in reverse:
        sql_parts.append(f'TRUNCATE TABLE public."{table}" CASCADE;')
    sql_parts.append("SET session_replication_role = origin;")

    def lit(v: Any) -> str:
        if v is None:
            return "NULL"
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return str(v)
        s = str(v).replace("'", "''")
        return f"'{s}'"

    for table in TABLES:
        rows = tables[table]
        if not rows:
            continue
        cols = list(rows[0].keys())
        col_list = ", ".join(f'"{c}"' for c in cols)
        print(f"Building INSERTs for {table} ({len(rows)} rows)...")
        batch: list[str] = []
        for i, row in enumerate(rows, 1):
            vals = ", ".join(lit(row.get(c)) for c in cols)
            batch.append(f'INSERT INTO public."{table}" ({col_list}) VALUES ({vals});')
            if len(batch) >= 50:
                sql_parts.extend(batch)
                batch = []
            if i % 200 == 0:
                print(f"  {table}: prepared {i}/{len(rows)}")
        sql_parts.extend(batch)

    sql_parts.append("COMMIT;")
    sql = "\n".join(sql_parts)
    print(f"Executing import SQL ({len(sql)} bytes) via psql...")
    r = subprocess.run(
        [psql, db_url, "-v", "ON_ERROR_STOP=1"],
        input=sql,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        print(r.stdout[-4000:] if r.stdout else "")
        print(r.stderr[-4000:] if r.stderr else "", file=sys.stderr)
        sys.exit(r.returncode)
    print("Import via psql done.")


def rest_upsert(
    base_url: str, service_key: str, table: str, rows: list[dict[str, Any]]
) -> None:
    if not rows:
        return
    url = f"{base_url.rstrip('/')}/rest/v1/{table}?on_conflict={CONFLICT[table]}"
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        body = json.dumps(chunk).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                resp.read()
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise SystemExit(f"REST upsert {table} failed ({e.code}): {err}") from e
        print(f"  REST {table}: upserted {min(i + batch_size, len(rows))}/{len(rows)}")


def import_via_rest(
    base_url: str, service_key: str, tables: dict[str, list[dict[str, Any]]]
) -> None:
    print("Importing via PostgREST (service_role)...")
    # Delete existing rows in reverse order (best-effort)
    for table in reversed(TABLES):
        # PostgREST delete-all needs a filter; use not.is.null on PK-ish column
        col = CONFLICT[table].split(",")[0]
        q = urllib.parse.urlencode({col: "not.is.null"})
        url = f"{base_url.rstrip('/')}/rest/v1/{table}?{q}"
        req = urllib.request.Request(
            url,
            method="DELETE",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                resp.read()
            print(f"  cleared {table}")
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            print(f"  warn: clear {table} ({e.code}): {err}")

    for table in TABLES:
        rest_upsert(base_url, service_key, table, tables[table])
    print("Import via REST done.")


def verify_anon(base_url: str, anon_key: str, mysql_counts: dict[str, int]) -> None:
    print("Verifying anon RLS...")

    def get(path: str) -> Any:
        req = urllib.request.Request(
            f"{base_url.rstrip('/')}{path}",
            headers={
                "apikey": anon_key,
                "Authorization": f"Bearer {anon_key}",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))

    # Prefer count headers
    def count(table: str, extra: str = "") -> int:
        q = "select=slug" if table != "card_authors" else "select=card_slug"
        url = f"{base_url.rstrip('/')}/rest/v1/{table}?{q}{extra}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": anon_key,
                "Authorization": f"Bearer {anon_key}",
                "Prefer": "count=exact",
                "Range": "0-0",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            cr = resp.headers.get("Content-Range", "")
            # e.g. 0-0/9
            if "/" in cr:
                return int(cr.split("/")[-1])
            return -1

    groups_c = count("groups")
    data_c = count("data")
    draft_rows = get("/rest/v1/data?select=slug,status_slug&status_slug=eq.draft&limit=5")
    pub_sample = get(
        "/rest/v1/data?select=slug,status_slug,title&status_slug=eq.published&limit=3"
    )

    print(f"  anon groups count: {groups_c} (mysql {mysql_counts.get('groups')})")
    print(f"  anon data count:   {data_c} (expect published only)")
    print(f"  anon draft probe:  {len(draft_rows)} rows (expect 0)")
    print(f"  anon published sample: {pub_sample}")

    if draft_rows:
        raise SystemExit("RLS failure: anon can see draft data rows")
    if data_c >= 0 and mysql_counts.get("data"):
        # soft check: anon data should be < total mysql data if drafts exist
        print("  RLS published filter looks OK" if not draft_rows else "")


def main() -> None:
    tables = fetch_mysql()
    mysql_counts = {t: len(tables[t]) for t in TABLES}

    db_url = env("SUPABASE_DB_URL") or env("DATABASE_URL")
    service_key = env("SUPABASE_SERVICE_ROLE_KEY")
    supabase_url = env("SUPABASE_URL") or env("VITE_SUPABASE_URL")
    anon_key = (
        env("SUPABASE_ANON_KEY")
        or env("VITE_SUPABASE_ANON_KEY")
        or env("SUPABASE_PUBLISHABLE_KEY")
    )

    if env("APPLY_SCHEMA") in ("1", "true", "yes"):
        if not db_url:
            print("APPLY_SCHEMA=1 requires SUPABASE_DB_URL", file=sys.stderr)
            sys.exit(2)
        apply_schema_psql(db_url)

    if db_url:
        import_via_psql(db_url, tables)
    elif service_key and supabase_url:
        print(
            "Note: REST path assumes schema.sql already applied in the project.",
            file=sys.stderr,
        )
        import_via_rest(supabase_url, service_key, tables)
    else:
        print(
            "No SUPABASE_DB_URL / DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY+SUPABASE_URL.\n"
            "Exported MySQL counts only. Apply supabase/schema.sql in Dashboard SQL Editor,\n"
            "then re-run with credentials.",
            file=sys.stderr,
        )
        for t, c in mysql_counts.items():
            print(f"  {t}: {c}")
        sys.exit(3)

    if env("VERIFY_ANON") in ("1", "true", "yes"):
        if not (supabase_url and anon_key):
            print("VERIFY_ANON=1 needs SUPABASE_URL and anon/publishable key", file=sys.stderr)
            sys.exit(2)
        verify_anon(supabase_url, anon_key, mysql_counts)

    print("Done.")
    for t, c in mysql_counts.items():
        print(f"  imported {t}: {c}")


if __name__ == "__main__":
    main()
