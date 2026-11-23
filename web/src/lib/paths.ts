/** Normalize media paths from DB (relative or absolute). */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

export function groupUrl(slug: string, subgroupSlug?: string | null): string {
  return subgroupSlug ? `/${slug}#${subgroupSlug}` : `/${slug}`
}

export function cardUrl(slug: string, urlSeoYandex?: string | null): string {
  return `/card/${urlSeoYandex || slug}`
}
