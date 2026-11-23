/** Vite public base, always ends with `/` (e.g. `/` or `/bibliotechka-4/`). */
export function viteBase(): string {
  return import.meta.env.BASE_URL || '/'
}

/** Router basename without trailing slash (`''` at domain root, `/bibliotechka-4` on Pages). */
export function routerBasename(): string {
  return viteBase().replace(/\/$/, '')
}

/**
 * Prefix a site-root path for `<img src>` / raw `<a href>` outside React Router.
 * Absolute http(s) URLs are returned unchanged. Idempotent if already prefixed.
 */
export function withBase(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = viteBase()
  if (base !== '/' && (path === base.slice(0, -1) || path.startsWith(base))) {
    return path
  }
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}

/** Normalize media paths from DB (relative or absolute). */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return withBase(path.startsWith('/') ? path : `/${path}`)
}

/**
 * Absolute URL on the current origin for share/copy (includes Vite base).
 * React Router `to` values must NOT use this — use groupUrl/cardUrl instead.
 */
export function appPath(path: string): string {
  return withBase(path.startsWith('/') ? path : `/${path}`)
}

/** React Router `to` values — no base prefix (BrowserRouter basename handles it). */
export function groupUrl(slug: string, subgroupSlug?: string | null): string {
  return subgroupSlug ? `/${slug}#${subgroupSlug}` : `/${slug}`
}

export function cardUrl(slug: string, urlSeoYandex?: string | null): string {
  return `/card/${urlSeoYandex || slug}`
}
