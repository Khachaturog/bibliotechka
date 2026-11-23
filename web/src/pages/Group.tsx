import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowUp, Check, ChevronLeft, Link as LinkIcon } from 'lucide-react'
import { Button } from '@base-ui/react/button'
import { Card } from '../components/Card'
import {
  getGroup,
  getGroupsSorted,
  getPublishedCardsForGroup,
  getSubgroupsForGroup,
  type Card as CardType,
  type Subgroup,
} from '../lib/data'
import { assetUrl, groupUrl } from '../lib/paths'

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
    <div className="group-page">
      <section className="wrap-center group-page-hero">
        <Link className="app-icon-btn group-page-back" to="/" aria-label="Назад">
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        {group.cover ? (
          <img
            className="group-page-cover"
            src={assetUrl(group.cover)}
            alt=""
            width={72}
            height={72}
          />
        ) : null}
        <div className="group-page-hero-text">
          <h1 className="group-page-title">{title}</h1>
          {description ? <p className="mono-body group-page-desc">{description}</p> : null}
          <p className="mono-meta group-page-count">{cards.length} материалов</p>
        </div>
      </section>

      <section
        className="group-page-badges subgroups-badge-wrap"
        ref={badgeWrapRef}
        aria-label="Подгруппы"
      >
        {subgroups.map((sg) => (
          <a
            key={sg.slug}
            href={`#${sg.slug}`}
            data-slug={sg.slug}
            className={`group-page-badge${activeSlug === sg.slug ? ' is-active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              history.pushState(null, '', `${location.pathname}#${sg.slug}`)
              scrollToSubgroup(sg.slug, true)
              setActiveSlug(sg.slug)
            }}
          >
            {sg.title_ru || sg.title_en || sg.slug}
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

      <section className="wrap-center group-page-others">
        <h2 className="section-heading">Другие группы</h2>
        <div className="groups-container group-page-others-grid">
          {otherGroups.map((g) => (
            <Link key={g.slug} className="group group-tile" to={groupUrl(g.slug)}>
              <div className="group-cover-wrap">
                <img
                  className="group-cover"
                  src={assetUrl(g.cover)}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="group-content">
                <p className="group-title">{g.title_ru || g.title_en || g.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Button
        className={`secondary-lg-full button-up${showUp ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Наверх"
      >
        <ArrowUp size={20} strokeWidth={1.75} aria-hidden />
      </Button>
    </div>
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
    <div className="wrap-center group-subgroup" id={subgroup.slug}>
      <div className="group-subgroup-header">
        <div className="title-with-button">
          <p className="section-heading container-title">
            {subgroup.title_ru || subgroup.title_en || subgroup.slug}
          </p>
          <button
            type="button"
            className="subtle-violet-24"
            aria-label="Скопировать ссылку"
            onClick={copyLink}
          >
            <span className="icon-link" style={{ display: copied ? 'none' : 'inline' }}>
              <LinkIcon size={16} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="icon-copied" style={{ display: copied ? 'inline' : 'none' }}>
              <Check size={16} strokeWidth={1.75} aria-hidden />
            </span>
          </button>
        </div>
        {subgroup.description_ru ? (
          <p className="mono-body group-subgroup-desc">{subgroup.description_ru}</p>
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
