import { cards, groups } from '../generated'
import { cardUrl } from '../lib/paths'

export type PrerenderRoute = {
  /** Pathname for the router, e.g. `/`, `/about`, `/designsystem`, `/card/foo` */
  path: string
  /** Output path relative to dist/, e.g. `index.html`, `about/index.html` */
  outFile: string
  /** Kind used for SEO / sitemap */
  kind: 'home' | 'about' | 'group' | 'card' | 'notfound'
}

/** All URLs to prerender after `vite build`. */
export function listRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [
    { path: '/', outFile: 'index.html', kind: 'home' },
    { path: '/about', outFile: 'about/index.html', kind: 'about' },
  ]

  const sortedGroups = [...groups].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  for (const g of sortedGroups) {
    routes.push({
      path: `/${g.slug}`,
      outFile: `${g.slug}/index.html`,
      kind: 'group',
    })
  }

  for (const c of cards) {
    const seo = c.url_seo_yandex || c.slug
    const path = cardUrl(c.slug, c.url_seo_yandex)
    routes.push({
      path,
      outFile: `card/${seo}/index.html`,
      kind: 'card',
    })
  }

  routes.push({
    path: '/404',
    outFile: '404.html',
    kind: 'notfound',
  })

  return routes
}

/** Sitemap URLs (no 404). */
export function listSitemapPaths(): string[] {
  return listRoutes()
    .filter((r) => r.kind !== 'notfound')
    .map((r) => r.path)
}
