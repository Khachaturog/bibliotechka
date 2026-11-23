/**
 * Post-`vite build` prerender: react-dom/server + route manifest → HTML files,
 * sitemap.xml, and 404.html under dist/.
 */
import { build } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const ssrOutDir = path.join(root, 'dist-ssr')
const SITE_URL = 'https://bibliotechka.site'

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function writeSitemap(paths) {
  const urls = paths.map(
    (p) =>
      `  <url><loc>${SITE_URL}${p === '/' ? '/' : escapeXml(p)}</loc></url>`,
  )
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8')
}

function injectHtml(template, { headHtml, appHtml, ssrContentHtml }) {
  let html = template

  // Replace default <title>…</title> and inject SEO before </head>
  html = html.replace(/<title>[^<]*<\/title>/, '')
  html = html.replace(
    '</head>',
    `    ${headHtml}\n  </head>`,
  )

  const ssrBlock = `<div id="ssr-content">${ssrContentHtml}</div>`
  const rootOpen = html.match(/<div id="root"><\/div>/)
  if (rootOpen) {
    html = html.replace(
      '<div id="root"></div>',
      `${ssrBlock}\n    <div id="root">${appHtml}</div>`,
    )
  } else {
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/,
      `${ssrBlock}\n    <div id="root">${appHtml}</div>`,
    )
  }

  return html
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('dist/index.html missing — run vite build first')
    process.exit(1)
  }

  console.log('Building SSR bundle…')
  await build({
    configFile: path.join(root, 'vite.config.ts'),
    build: {
      ssr: path.join(root, 'src/ssr/entry.tsx'),
      outDir: ssrOutDir,
      emptyOutDir: true,
      sourcemap: false,
    },
    logLevel: 'warn',
  })

  const entryPath = path.join(ssrOutDir, 'entry.js')
  if (!fs.existsSync(entryPath)) {
    // Vite may emit entry.mjs or nested path
    const files = fs.readdirSync(ssrOutDir)
    console.error('SSR entry not found at', entryPath, 'got:', files)
    process.exit(1)
  }

  const { render, listRoutes, listSitemapPaths } = await import(
    pathToFileURL(entryPath).href
  )

  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
  const routes = listRoutes()
  console.log(`Prerendering ${routes.length} routes…`)

  let ok = 0
  for (const route of routes) {
    const { appHtml, headHtml, ssrContentHtml } = render(route.path)
    const html = injectHtml(template, { headHtml, appHtml, ssrContentHtml })
    const outPath = path.join(distDir, route.outFile)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, html, 'utf8')
    ok += 1
  }

  const sitemapPaths = listSitemapPaths()
  writeSitemap(sitemapPaths)
  console.log(`Wrote sitemap.xml (${sitemapPaths.length} URLs)`)
  console.log(`Prerendered ${ok} HTML files → ${distDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
