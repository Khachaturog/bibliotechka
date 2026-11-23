import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppShell } from '../App'
import { AppRoutes } from '../routes'
import { listRoutes, listSitemapPaths } from './manifest'
import { buildSeo, buildSsrContent, renderHeadTags } from './seo'

export type RenderResult = {
  appHtml: string
  headHtml: string
  ssrContentHtml: string
}

export function render(url: string): RenderResult {
  const pathname = url.startsWith('http') ? new URL(url).pathname : url
  const appHtml = renderToString(
    <StaticRouter location={pathname}>
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
