#!/usr/bin/env node
/**
 * Pull published catalog from Supabase (anon) into src/generated/*.json
 *
 * Env: VITE_SUPABASE_URL (or SUPABASE_URL), VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
 * Loads web/.env if present (KEY=VALUE lines only).
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'src', 'generated')

async function loadDotEnv() {
  try {
    const text = await readFile(join(root, '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* optional */
  }
}

function requireEnv(name, aliases = []) {
  for (const k of [name, ...aliases]) {
    if (process.env[k]) return process.env[k]
  }
  throw new Error(`Missing env ${name} (or ${aliases.join(', ')})`)
}

async function restAll(base, key, table, query = '') {
  const rows = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    const to = from + pageSize - 1
    const url = `${base}/rest/v1/${table}?${query}${query ? '&' : ''}select=*`
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        Range: `${from}-${to}`,
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`${table} ${res.status}: ${body}`)
    }
    const chunk = await res.json()
    rows.push(...chunk)
    if (chunk.length < pageSize) break
    from += pageSize
  }
  return rows
}

await loadDotEnv()
let base
let key
try {
  base = requireEnv('VITE_SUPABASE_URL', ['SUPABASE_URL']).replace(/\/$/, '')
  key = requireEnv('VITE_SUPABASE_ANON_KEY', [
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
  ])
} catch (err) {
  console.warn(
    String(err.message || err),
    '\nSkipping fetch — using committed src/generated/*.json',
  )
  process.exit(0)
}

console.log('Fetching from', base)

const [groups, subgroups, versions, authors, cards, cardAuthors] =
  await Promise.all([
    restAll(base, key, 'groups', 'order=sort.asc'),
    restAll(base, key, 'subgroups', 'order=sort.asc'),
    restAll(base, key, 'versions', 'order=slug.asc'),
    restAll(base, key, 'authors'),
    restAll(base, key, 'data', 'status_slug=eq.published&order=slug.asc'),
    restAll(base, key, 'card_authors'),
  ])

const authorBySlug = Object.fromEntries(authors.map((a) => [a.slug, a]))
const authorsByCard = {}
for (const row of cardAuthors) {
  const list = authorsByCard[row.card_slug] || (authorsByCard[row.card_slug] = [])
  const a = authorBySlug[row.author_slug]
  if (a) list.push(a)
}

const cardsEnriched = cards.map((c) => ({
  ...c,
  authors: authorsByCard[c.slug] || [],
}))

await mkdir(outDir, { recursive: true })

const payload = {
  generatedAt: new Date().toISOString(),
  counts: {
    groups: groups.length,
    subgroups: subgroups.length,
    versions: versions.length,
    authors: authors.length,
    cards: cardsEnriched.length,
    cardAuthors: cardAuthors.length,
  },
}

await writeFile(join(outDir, 'meta.json'), JSON.stringify(payload, null, 2))
await writeFile(join(outDir, 'groups.json'), JSON.stringify(groups))
await writeFile(join(outDir, 'subgroups.json'), JSON.stringify(subgroups))
await writeFile(join(outDir, 'versions.json'), JSON.stringify(versions))
await writeFile(join(outDir, 'cards.json'), JSON.stringify(cardsEnriched))
// Keep hand-tuned index.ts types; only refresh JSON payloads above.
console.log('Note: src/generated/index.ts types are maintained in repo')

console.log('Wrote', outDir)
console.log(payload.counts)
