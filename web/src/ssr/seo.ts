import { cards, groups, versions } from '../generated'
import { withBase } from '../lib/paths'
import { getCardBySeo, getGroup } from '../lib/data'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  YANDEX_VERIFICATION,
} from './site'

export type PageSeo = {
  title: string
  description: string
  canonical: string
  ogType: 'website' | 'article'
  ogImage: string
  robots: string
  jsonLd: Record<string, unknown>[]
}

/** Absolute media URL on the production domain (never includes Vite project base). */
function absMedia(path: string | null | undefined): string {
  if (!path) return DEFAULT_OG_IMAGE
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Collapse whitespace so meta attribute values stay on one line. */
function escapeAttr(s: string): string {
  return escapeHtml(s.replace(/\s+/g, ' ').trim())
}

function orgSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE,
    },
    description:
      'Коллекция лучших материалов для дизайнеров: UX/UI, типографика, дизайн-системы, вдохновение',
  }
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Коллекция лучших материалов по дизайну, UX/UI, типографике и вдохновению',
  }
}

export function buildSeo(pathname: string): PageSeo {
  const path = pathname.split('?')[0] || '/'

  if (path === '/' || path === '') {
    const count = cards.length
    const title = `${SITE_NAME} — коллекция материалов для дизайнеров`
    const description = `${SITE_NAME} — коллекция ${count}+ лучших материалов по дизайну, UX/UI, типографике и вдохновению. Ресурсы, дизайн-системы, портфолио и книги для дизайнеров.`
    return {
      title,
      description,
      canonical: `${SITE_URL}/`,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      jsonLd: [
        websiteSchema(),
        orgSchema(),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${SITE_NAME} — материалы для дизайнеров`,
          url: `${SITE_URL}/`,
          description: `Коллекция ${count} материалов для дизайнеров: ресурсы, дизайн-системы, книги и вдохновение`,
          numberOfItems: count,
        },
      ],
    }
  }

  if (path === '/about') {
    const title = `О проекте — ${SITE_NAME}`
    const description =
      'История и развитие проекта «Библиотечка»: зачем он нужен, как развивался и что нового появляется в версиях.'
    return {
      title,
      description,
      canonical: `${SITE_URL}/about`,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      jsonLd: [
        orgSchema(),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: `${SITE_URL}/about`,
          description,
          numberOfItems: versions.length,
        },
      ],
    }
  }

  if (path === '/404' || path === '/404.html') {
    return {
      title: `Страница не найдена — ${SITE_NAME}`,
      description: 'Запрошенная страница не найдена.',
      canonical: `${SITE_URL}/404`,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      robots: 'noindex, follow',
      jsonLd: [orgSchema()],
    }
  }

  const cardMatch = path.match(/^\/card\/([^/]+)\/?$/)
  if (cardMatch) {
    const card = getCardBySeo(decodeURIComponent(cardMatch[1]))
    if (card) {
      const title = card.title || SITE_NAME
      const description = card.description || 'Материал из Библиотечки.'
      const image = absMedia(card.cover_large || card.cover_short)
      const canonical = `${SITE_URL}/card/${card.url_seo_yandex || card.slug}`
      const article: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        url: canonical,
        description,
        image,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
      }
      if (card.published) {
        const ts = Date.parse(card.published)
        if (!Number.isNaN(ts)) {
          article.datePublished = new Date(ts).toISOString().slice(0, 10)
        }
      }
      if (card.updated_at) {
        const ts = Date.parse(card.updated_at)
        if (!Number.isNaN(ts)) {
          article.dateModified = new Date(ts).toISOString()
        }
      }
      return {
        title,
        description,
        canonical,
        ogType: 'article',
        ogImage: image,
        robots: 'index, follow',
        jsonLd: [article, orgSchema()],
      }
    }
  }

  const groupSlug = path.replace(/^\//, '').replace(/\/$/, '')
  const group = getGroup(groupSlug) || groups.find((g) => g.slug === groupSlug)
  if (group) {
    const titleBase = group.title_ru || group.title_en || group.slug
    const title = group.title_seo || `${titleBase} — ${SITE_NAME}`
    const groupCards = cards.filter((c) => c.group_slug === group.slug)
    const description =
      group.description_seo ||
      group.og_description ||
      (group.description_ru
        ? `${group.description_ru} (${groupCards.length} материалов)`
        : `Раздел «${titleBase}» — ${groupCards.length} материалов на Библиотечке.`)
    const ogImage = group.og_image
      ? absMedia(group.og_image)
      : group.cover
        ? absMedia(group.cover)
        : DEFAULT_OG_IMAGE
    const canonical = `${SITE_URL}/${group.slug}`
    return {
      title,
      description,
      canonical,
      ogType: 'website',
      ogImage,
      robots: 'index, follow',
      jsonLd: [
        orgSchema(),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: canonical,
          description,
          numberOfItems: groupCards.length,
        },
      ],
    }
  }

  return {
    title: `${SITE_NAME}`,
    description: 'Коллекция материалов для дизайнеров.',
    canonical: `${SITE_URL}${path}`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'noindex, follow',
    jsonLd: [orgSchema()],
  }
}

/** Textual SEO block (PHP `#ssr-content` parity) — visible to crawlers without JS. */
export function buildSsrContent(pathname: string): string {
  const path = pathname.split('?')[0] || '/'

  if (path === '/' || path === '') {
    const groupLinks = [...groups]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((g) => {
        const t = escapeHtml(g.title_ru || g.title_en || g.slug)
        const d = g.description_ru ? `<p>${escapeHtml(g.description_ru)}</p>` : ''
        return `<a href="${escapeHtml(withBase(`/${g.slug}`))}"><h2>${t}</h2>${d}</a>`
      })
      .join('\n')
    const cardLinks = cards
      .map((c) => {
        const href = escapeHtml(withBase(`/card/${c.url_seo_yandex || c.slug}`))
        const t = escapeHtml(c.title)
        const d = c.description ? `<p>${escapeHtml(c.description)}</p>` : ''
        return `<a href="${href}"><h3>${t}</h3>${d}</a>`
      })
      .join('\n')
    return `<h1>${escapeHtml(SITE_NAME)}</h1>
<section><h2>Разделы</h2>${groupLinks}</section>
<section><h2>Материалы ${cards.length}</h2>${cardLinks}</section>`
  }

  if (path === '/about') {
    const items = versions
      .map((v) => {
        const parts = [
          v.version ? `<p><strong>Версия ${escapeHtml(String(v.version))}</strong></p>` : '',
          v.title ? `<h3>${escapeHtml(v.title)}</h3>` : '',
          v.description ? `<p>${escapeHtml(v.description)}</p>` : '',
        ]
        return `<article>${parts.join('')}</article>`
      })
      .join('\n')
    return `<h1>О проекте — ${escapeHtml(SITE_NAME)}</h1><h2>История версий</h2>${items}`
  }

  if (path === '/404' || path === '/404.html') {
    return `<h1>404</h1><p>Страница не найдена.</p><p><a href="${escapeHtml(withBase('/'))}">На главную</a></p>`
  }

  const cardMatch = path.match(/^\/card\/([^/]+)\/?$/)
  if (cardMatch) {
    const card = getCardBySeo(decodeURIComponent(cardMatch[1]))
    if (card) {
      const linkPairs: Array<[string | null | undefined, string | null | undefined]> = [
        [card.url_1, card.url_title_1],
        [card.url_2, card.url_title_2],
        [card.url_3, card.url_title_3],
        [card.url_4, card.url_title_4],
        [card.url_5, card.url_title_5],
        [card.url_6, card.url_title_6],
      ]
      const links = linkPairs
        .map(([url, title]) => {
          if (!url) return ''
          return `<li><a href="${escapeHtml(url)}">${escapeHtml(title || url)}</a></li>`
        })
        .filter(Boolean)
        .join('')
      const authors = (card.authors || [])
        .map((a) => `<li>${escapeHtml(a.title_ru || a.title_en || a.slug)}</li>`)
        .join('')
      return `<article>
<h1>${escapeHtml(card.title)}</h1>
${card.description ? `<p>${escapeHtml(card.description)}</p>` : ''}
${card.summary_ai ? `<p>${escapeHtml(card.summary_ai)}</p>` : ''}
${links ? `<ul>${links}</ul>` : ''}
${authors ? `<ul>${authors}</ul>` : ''}
<p><a href="${SITE_URL}/card/${escapeHtml(card.url_seo_yandex || card.slug)}">${SITE_URL}/card/${escapeHtml(card.url_seo_yandex || card.slug)}</a></p>
</article>`
    }
  }

  const groupSlug = path.replace(/^\//, '').replace(/\/$/, '')
  const group = getGroup(groupSlug)
  if (group) {
    const title = escapeHtml(group.title_ru || group.title_en || group.slug)
    const desc = group.description_ru
      ? `<p>${escapeHtml(group.description_ru)}</p>`
      : ''
    const groupCards = cards.filter((c) => c.group_slug === group.slug)
    const list = groupCards
      .map((c) => {
        const href = escapeHtml(withBase(`/card/${c.url_seo_yandex || c.slug}`))
        return `<li><a href="${href}">${escapeHtml(c.title)}</a></li>`
      })
      .join('')
    return `<h1>${title}</h1>${desc}<ul>${list}</ul>`
  }

  return `<h1>${escapeHtml(SITE_NAME)}</h1>`
}

export function renderHeadTags(seo: PageSeo): string {
  const jsonLd = seo.jsonLd
    .map(
      (block) =>
        `<script type="application/ld+json">${JSON.stringify(block)}</script>`,
    )
    .join('\n')

  return [
    `<title>${escapeAttr(seo.title)}</title>`,
    `<meta name="description" content="${escapeAttr(seo.description)}">`,
    `<link rel="canonical" href="${escapeAttr(seo.canonical)}">`,
    `<link rel="alternate" hreflang="ru" href="${escapeAttr(seo.canonical)}">`,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttr(seo.canonical)}">`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">`,
    `<meta property="og:title" content="${escapeAttr(seo.title)}">`,
    `<meta property="og:description" content="${escapeAttr(seo.description)}">`,
    `<meta property="og:image" content="${escapeAttr(seo.ogImage)}">`,
    `<meta property="og:type" content="${seo.ogType}">`,
    `<meta property="og:url" content="${escapeAttr(seo.canonical)}">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@bibliotechka">`,
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}">`,
    `<meta name="twitter:image" content="${escapeAttr(seo.ogImage)}">`,
    `<meta name="robots" content="${seo.robots}">`,
    `<meta name="yandex-verification" content="${YANDEX_VERIFICATION}">`,
    jsonLd,
    `<script>document.documentElement.classList.add('js');</script>`,
    `<style>html.js #ssr-content { display: none !important; }</style>`,
  ].join('\n    ')
}
