import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import {
  getGroup,
  getGroupsSorted,
  getPublishedCardsForGroup,
  getSubgroupsForGroup,
  type Card as CardType,
  type Subgroup,
} from '../lib/data'
import { groupUrl } from '../lib/paths'

export function Group() {
  const { group: groupSlug } = useParams<{ group: string }>()
  const location = useLocation()
  const group = groupSlug ? getGroup(groupSlug) : undefined

  const cards = useMemo(
    () => (groupSlug ? getPublishedCardsForGroup(groupSlug) : []),
    [groupSlug],
  )
  const subgroups = useMemo(() => {
    if (!groupSlug) return []
    return getSubgroupsForGroup(groupSlug).filter((sg) =>
      cards.some((c) => c.subgroup_slug === sg.slug),
    )
  }, [groupSlug, cards])

  const otherGroups = useMemo(
    () => getGroupsSorted().filter((g) => g.slug !== groupSlug),
    [groupSlug],
  )

  const badgeWrapRef = useRef<HTMLElement>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const scrollToSubgroup = useCallback((slug: string, smooth = true) => {
    const el = document.getElementById(slug)
    if (!el) return
    const title = el.querySelector('.container-title')
    const target = (title as HTMLElement) || el
    const offset = 83
    const top = target.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const slug = location.hash.slice(1)
    const t = window.setTimeout(() => scrollToSubgroup(slug, true), 100)
    return () => window.clearTimeout(t)
  }, [location.hash, groupSlug, scrollToSubgroup])

  useEffect(() => {
    const onScroll = () => {
      const wrap = badgeWrapRef.current
      if (!wrap) return
      let matched: string | null = null
      for (const sg of subgroups) {
        const el = document.getElementById(sg.slug)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= 90 && rect.bottom > 90) matched = sg.slug
      }
      setActiveSlug(matched)
      if (matched) {
        const badge = wrap.querySelector(
          `a.badge[data-slug="${CSS.escape(matched)}"]`,
        ) as HTMLElement | null
        if (badge) centerBadge(badge, false)
      }
    }
    let raf = 0
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        onScroll()
      })
    }
    window.addEventListener('scroll', schedule, { passive: true })
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [subgroups])

  const [showUp, setShowUp] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowUp(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!groupSlug || !group) {
    return <Navigate to="/" replace />
  }

  const title = group.title_ru || group.title_en || group.slug
  const description = group.description_ru || ''

  return (
    <>
      <section className="wrap-center">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link className="secondary-sm" to="/" aria-label="Назад">
            <ChevronLeft />
          </Link>
          <div
            className="cards-container-0-header"
            style={{ borderRadius: '8px 20px 20px 8px', flex: 1 }}
          >
            <h1 className="h1 container-title">{title}</h1>
            {description ? (
              <p className="md-regular container-description">{description}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="badge-wrap subgroups-badge-wrap"
        ref={badgeWrapRef}
        aria-label="Подгруппы"
      >
        {subgroups.map((sg) => (
          <a
            key={sg.slug}
            href={`#${sg.slug}`}
            data-slug={sg.slug}
            className={`badge chip-neutral-label-small${activeSlug === sg.slug ? ' active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              history.pushState(null, '', `${location.pathname}#${sg.slug}`)
              scrollToSubgroup(sg.slug, true)
              setActiveSlug(sg.slug)
            }}
          >
            <span className="md-medium badge-title">
              {sg.title_ru || sg.title_en || sg.slug}
            </span>
          </a>
        ))}
      </section>

      <main className="subgroups-wrap">
        {subgroups.map((sg) => (
          <SubgroupBlock
            key={sg.slug}
            subgroup={sg}
            cards={cards.filter((c) => c.subgroup_slug === sg.slug)}
          />
        ))}
      </main>

      <section className="wrap-center cards-container-0">
        <h2 className="h1" style={{ color: 'var(--02-content-primary)' }}>
          Другие группы
        </h2>
        <section className="other-groups-badge-wrap other-groups-wrap">
          {otherGroups.map((g) => (
            <Link
              key={g.slug}
              to={groupUrl(g.slug)}
              className="chip-neutral-label-small other-group-badge"
            >
              <span className="md-medium other-group-badge-title">
                {g.title_ru || g.title_en || g.slug}
              </span>
            </Link>
          ))}
        </section>
      </section>

      <button
        type="button"
        className={`secondary-lg-full button-up${showUp ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Наверх"
      >
        <span className="icon-up">↑</span>
      </button>
    </>
  )
}

function SubgroupBlock({
  subgroup,
  cards,
}: {
  subgroup: Subgroup
  cards: CardType[]
}) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${subgroup.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 800)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="wrap-center cards-container-0" id={subgroup.slug}>
      <div className="cards-container-0-header">
        <div className="title-with-button">
          <p className="h1 container-title">
            {subgroup.title_ru || subgroup.title_en || subgroup.slug}
          </p>
          <button
            type="button"
            className="subtle-violet-24"
            aria-label="Скопировать ссылку"
            onClick={copyLink}
          >
            <span className="icon-link" style={{ display: copied ? 'none' : 'inline' }}>
              🔗
            </span>
            <span className="icon-copied" style={{ display: copied ? 'inline' : 'none' }}>
              ✓
            </span>
          </button>
        </div>
        {subgroup.description_ru ? (
          <p className="lg-regular container-description">{subgroup.description_ru}</p>
        ) : null}
      </div>
      <div className="cards-container">
        {cards.map((c) => (
          <Card key={c.slug} card={c} />
        ))}
      </div>
    </div>
  )
}

function centerBadge(badge: HTMLElement, smooth: boolean) {
  const wrap = badge.closest('.subgroups-badge-wrap') as HTMLElement | null
  if (!wrap) return
  const wrapRect = wrap.getBoundingClientRect()
  const badgeRect = badge.getBoundingClientRect()
  const delta =
    badgeRect.left + badgeRect.width / 2 - (wrapRect.left + wrapRect.width / 2)
  const nextLeft = wrap.scrollLeft + delta
  const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth)
  wrap.scrollTo({
    left: Math.max(0, Math.min(maxLeft, nextLeft)),
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
