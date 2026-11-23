/**
 * Post-`vite build` prerender: react-dom/server + route manifest → HTML files,
 * sitemap.xml, and 404.html under dist/.
 *
 * Also rewrites any remaining root-absolute href/src ( /covers, /images, /assets,
 * in-app routes ) to include VITE_BASE so GH Pages project preview cannot 404.
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

function normalizeBase(raw) {
  let base = raw || '/'
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

function viteBaseFromEnv() {
  return normalizeBase(process.env.VITE_BASE || '/')
}

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

/**
 * Prefix root-absolute href/src that are missing the Vite base.
 * Leaves https://, //cdn, and already-prefixed paths alone.
 */
function prefixRootPaths(html, base) {
  const b = normalizeBase(base)
  if (b === '/') return html
  const prefix = b.slice(0, -1) // e.g. /subdir when base !== '/'
  const re = new RegExp(
    `\\b(href|src)="(/(?!/)(?!${prefix.slice(1)}(?:/|"|$))[^"]*)"`,
    'g',
  )
  return html.replace(re, (_, attr, p) => `${attr}="${prefix}${p}"`)
}

/** Fail the build if bare asset paths remain when a non-root base is set. */
function assertPrefixedAssets(html, file, base) {
  const b = normalizeBase(base)
  if (b === '/') return
  const prefix = b.slice(0, -1)
  const bad = []
  const re = /\b(href|src)="(\/(?:covers|images|assets|favicon)[^"]*)"/g
  let m
  while ((m = re.exec(html)) !== null) {
    if (!m[2].startsWith(`${prefix}/`) && m[2] !== prefix) {
      bad.push(m[2])
    }
  }
  if (bad.length) {
    throw new Error(
      `${file}: bare asset paths without base ${prefix}: ${bad.slice(0, 8).join(', ')}`,
    )
  }
}

function injectHtml(template, { headHtml, appHtml, ssrContentHtml }, base) {
  let html = template

  html = html.replace(/<title>[^<]*<\/title>/, '')
  html = html.replace('</head>', `    ${headHtml}\n  </head>`)

  const ssrBlock = `<div id="ssr-content">${ssrContentHtml}</div>`
  if (html.includes('<div id="root"></div>')) {
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

  html = prefixRootPaths(html, base)
  return html
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('dist/index.html missing — run vite build first')
    process.exit(1)
  }

  const base = viteBaseFromEnv()
  console.log(`Prerender base: ${base}`)

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
    const html = injectHtml(
      template,
      { headHtml, appHtml, ssrContentHtml },
      base,
    )
    assertPrefixedAssets(html, route.outFile, base)
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
