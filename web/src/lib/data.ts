import {
  cards,
  groups,
  subgroups,
  versions,
  meta,
  type Card,
  type Group,
  type Subgroup,
  type Version,
} from '../generated'

export type { Card, Group, Subgroup, Version }
export { cards, groups, subgroups, versions, meta }

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getGroupsSorted(): Group[] {
  return [...groups].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export function getGroup(slug: string): Group | undefined {
  return groups.find((g) => g.slug === slug)
}

export function getSubgroupsForGroup(groupSlug: string): Subgroup[] {
  return subgroups
    .filter((s) => s.group_slug === groupSlug)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export function getPublishedCardsForGroup(groupSlug: string): Card[] {
  return cards.filter((c) => c.group_slug === groupSlug)
}

export function getCardBySeo(seoSlug: string): Card | undefined {
  return (
    cards.find((c) => c.url_seo_yandex === seoSlug) ||
    cards.find((c) => c.slug === seoSlug)
  )
}

export function getSubgroup(slug: string | null | undefined): Subgroup | undefined {
  if (!slug) return undefined
  return subgroups.find((s) => s.slug === slug)
}

export function getRandomCard(excludeSlug?: string): Card | undefined {
  const pool = excludeSlug ? cards.filter((c) => c.slug !== excludeSlug) : cards
  if (pool.length === 0) return undefined
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getVersionsSorted(): Version[] {
  return [...versions].sort((a, b) => {
    const av = parseFloat(String(a.version)) || 0
    const bv = parseFloat(String(b.version)) || 0
    return bv - av
  })
}

/** Groups that have at least one published card, with subgroup chips that have cards. */
export function getSearchCatalog() {
  const sortedGroups = getGroupsSorted()
  return sortedGroups
    .map((group) => {
      const groupCards = cards.filter((c) => c.group_slug === group.slug)
      if (groupCards.length === 0) return null
      const subgroupSlugs = [
        ...new Set(
          groupCards.map((c) => c.subgroup_slug).filter(Boolean) as string[],
        ),
      ]
      const chips = subgroupSlugs
        .map((slug) => subgroups.find((s) => s.slug === slug))
        .filter((s): s is Subgroup => Boolean(s))
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      return { group, subgroups: chips }
    })
    .filter(Boolean) as { group: Group; subgroups: Subgroup[] }[]
}

const SEARCH_LIMIT = 40

/** Free-text spotlight search over published catalog fields (no new data). */
export function searchCards(query: string, limit = SEARCH_LIMIT): Card[] {
  const q = query.trim().toLocaleLowerCase('ru')
  if (!q) return []

  const scored: { card: Card; score: number }[] = []
  for (const card of cards) {
    const title = (card.title || '').toLocaleLowerCase('ru')
    const desc = (card.description || '').toLocaleLowerCase('ru')
    const summary = (card.summary_ai || '').toLocaleLowerCase('ru')
    const authors = (card.authors || [])
      .map((a) => `${a.title_ru || ''} ${a.title_en || ''}`.toLocaleLowerCase('ru'))
      .join(' ')
    const hay = `${title} ${desc} ${summary} ${authors} ${card.slug}`

    if (!hay.includes(q)) continue

    let score = 0
    if (title.startsWith(q)) score += 100
    else if (title.includes(q)) score += 60
    if (authors.includes(q)) score += 30
    if (desc.includes(q)) score += 20
    if (summary.includes(q)) score += 10
    scored.push({ card, score })
  }

  scored.sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title, 'ru'))
  return scored.slice(0, limit).map((s) => s.card)
}

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

export function formatDateRu(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.trim())
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`
}
