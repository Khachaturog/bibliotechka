import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppShell } from '../App'
import { AppRoutes } from '../routes'
import { routerBasename } from '../lib/paths'
import { listRoutes, listSitemapPaths } from './manifest'
import { buildSeo, buildSsrContent, renderHeadTags } from './seo'

export type RenderResult = {
  appHtml: string
  headHtml: string
  ssrContentHtml: string
}

export function render(url: string): RenderResult {
  const pathname = url.startsWith('http') ? new URL(url).pathname : url
  const basename = routerBasename()
  // RR requires location to start with basename when set.
  const location =
    basename && !pathname.startsWith(basename)
      ? `${basename}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
      : pathname
  const appHtml = renderToString(
    <StaticRouter
      basename={basename || undefined}
      location={location}
    >
      <AppShell>
        <AppRoutes />
      </AppShell>
    </StaticRouter>,
  )
  const seo = buildSeo(pathname)
  return {
    appHtml,
    headHtml: renderHeadTags(seo),
    ssrContentHtml: buildSsrContent(pathname),
  }
}

export { listRoutes, listSitemapPaths, buildSeo }
