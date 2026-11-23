import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import {
  ArrowUpRight,
  ChevronLeft,
  Dices,
  Home,
  Share,
  X,
} from 'lucide-react'
import {
  getCardBySeo,
  getGroup,
  getRandomCard,
  getSubgroup,
} from '../lib/data'
import { appPath, assetUrl, cardUrl, groupUrl } from '../lib/paths'
import { useIsMobileNav } from '../lib/media'

export function CardDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobileNav()
  const card = seoSlug ? getCardBySeo(seoSlug) : undefined
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(true)
  }, [seoSlug])

  if (!seoSlug || !card) {
    return <Navigate to="/" replace />
  }

  const group = getGroup(card.group_slug || '')
  const subgroup = getSubgroup(card.subgroup_slug)
  const backTo = groupUrl(card.group_slug || '', card.subgroup_slug)
  const links = [
    { url: card.url_1, title: card.url_title_1 },
    { url: card.url_2, title: card.url_title_2 },
    { url: card.url_3, title: card.url_title_3 },
    { url: card.url_4, title: card.url_title_4 },
    { url: card.url_5, title: card.url_title_5 },
    { url: card.url_6, title: card.url_title_6 },
  ].filter((l) => Boolean(l.url))
  const authors = card.authors || []

  const dismiss = () => {
    setOpen(false)
    window.setTimeout(() => {
      if (window.history.length > 1) navigate(-1)
      else navigate(backTo)
    }, 180)
  }

  const share = async () => {
    const path = appPath(cardUrl(card.slug, card.url_seo_yandex))
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title: card.title, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована!')
      }
    } catch {
      /* cancelled */
    }
  }

  const random = () => {
    const next = getRandomCard(card.slug)
    if (next) navigate(cardUrl(next.slug, next.url_seo_yandex))
  }

  return (
    <>
      {/* SEO / SSR shell under the drawer */}
      <div className="card-detail-ssr-shell" aria-hidden={!open}>
        <h1 className="h1">{card.title}</h1>
        {card.description ? <p className="md-regular">{card.description}</p> : null}
      </div>

      <BaseDrawer.Root
        open={open}
        swipeDirection={isMobile ? 'down' : 'right'}
        onOpenChange={(next) => {
          if (!next) dismiss()
          else setOpen(true)
        }}
      >
        <BaseDrawer.Portal>
          <BaseDrawer.Backdrop className="app-drawer-backdrop app-drawer-backdrop--visible" />
          <BaseDrawer.Viewport
            className={`app-drawer-viewport${isMobile ? ' app-drawer-viewport--sheet' : ' app-drawer-viewport--side'}`}
          >
            <BaseDrawer.Popup
              className={`app-drawer-popup card-detail-drawer${isMobile ? ' app-drawer-popup--sheet card-detail-drawer--sheet' : ' app-drawer-popup--side card-detail-drawer--side'}${open ? ' open' : ''}`}
            >
              <BaseDrawer.Content className="app-drawer-content card-detail-drawer-content">
                {isMobile ? <div className="app-drawer-handle" aria-hidden /> : null}

                <div className="card-detail-toolbar">
                  <button
                    type="button"
                    className="secondary-sm"
                    onClick={dismiss}
                    aria-label="Закрыть"
                  >
                    {isMobile ? (
                      <X size={20} strokeWidth={1.75} aria-hidden />
                    ) : (
                      <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    className="secondary-sm"
                    onClick={random}
                    aria-label="Случайная"
                  >
                    <Dices size={20} strokeWidth={1.75} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="secondary-sm"
                    onClick={share}
                    aria-label="Поделиться"
                  >
                    <Share size={20} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>

                <div className="detail-container card-detail-body" id="detail-container-0">
                  <div className="detail-container-image">
                    <img
                      className="image image-blur"
                      src={assetUrl(card.cover_large)}
                      alt=""
                      aria-hidden
                    />
                    <img
                      className="image"
                      src={assetUrl(card.cover_large)}
                      alt={card.title}
                    />
                  </div>

                  <nav
                    className="detail-breadcrumb"
                    aria-label="Хлебные крошки"
                  >
                    <Link to="/" className="badge chip-neutral-label-small" aria-label="Главная">
                      <Home size={14} strokeWidth={1.75} aria-hidden />
                    </Link>
                    <span aria-hidden>›</span>
                    <Link
                      to={groupUrl(card.group_slug || '')}
                      className="badge chip-neutral-label-small"
                    >
                      <span className="md-medium badge-title">
                        {group?.title_ru || card.group_slug}
                      </span>
                    </Link>
                    <span aria-hidden>›</span>
                    <Link
                      to={groupUrl(card.group_slug || '', card.subgroup_slug)}
                      className="badge chip-neutral-label-small"
                    >
                      <span className="md-medium badge-title">
                        {subgroup?.title_ru || card.subgroup_slug}
                      </span>
                    </Link>
                  </nav>

                  <div className="detail-block1">
                    <h1 className="detail-block1-title mono-title card-detail-title">
                      {card.title}
                    </h1>
                    {card.description ? (
                      <div className="detail-block1-subtitle mono-body">
                        {card.description}
                      </div>
                    ) : null}
                  </div>

                  {links.length > 0 ? (
                    <div className="detail-block2-list">
                      {links.map((link) => (
                        <a
                          key={link.url!}
                          className="detail-block2-list-item"
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="detail-block2-text">
                            <div className="lg-regular detail-block2-list-title">
                              {link.title || 'Ссылка'}
                            </div>
                            <div className="sm-regular detail-block2-list-subtitle">
                              {link.url}
                            </div>
                          </div>
                          <span className="icon-diagonal-arrow">
                            <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {authors.length > 0 ? (
                    <div className="detail-block3">
                      <div className="detail-block3-list">
                        {authors.map((a) => (
                          <div className="lg-regular detail-block3-author" key={a.slug}>
                            {a.title_ru || a.title_en || a.slug}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="detail-ai">
                    <div className="lg-regular detail-ai-summary">
                      {card.summary_ai || 'Однажды напишет саммари'}
                    </div>
                    <div className="detail-ai-label-wrap">
                      <div className="sm-regular detail-ai-label">Библиотечка AI</div>
                    </div>
                  </div>

                  <div className="detail-meta">
                    <MetaRow
                      label="Проведено"
                      value={`${card.start_date || '—'} – ${card.end_date || '—'}`}
                      empty={!card.start_date && !card.end_date}
                    />
                    <MetaRow
                      label="Статья опубликована"
                      value={card.published || '—'}
                      empty={!card.published}
                    />
                    <MetaRow label="Номер в картотеке" value={card.slug} />
                    <MetaRow label="Обновлено" value={card.updated_at || '—'} />
                    <MetaRow label="Создано" value={card.created_at || '—'} />
                    <MetaRow label="Раздел" value={card.group_slug || '—'} />
                    <MetaRow label="Теги" value={card.detail || '—'} />
                    <MetaRow label="Категория" value={card.subgroup_slug || '—'} />
                    <MetaRow label="Появилось в версии" value={card.version_slug || '—'} />
                    <MetaRow label="Статус" value={card.status_slug || '—'} />
                  </div>

                  <button
                    type="button"
                    className="secondary-text-lg card-detail-feedback"
                    onClick={() =>
                      window.open(
                        'https://forms.yandex.ru/u/69386a2c02848f99bdd0ee07',
                        '_blank',
                      )
                    }
                  >
                    <p className="md-regular">Форма обратной связи</p>
                  </button>
                </div>
              </BaseDrawer.Content>
            </BaseDrawer.Popup>
          </BaseDrawer.Viewport>
        </BaseDrawer.Portal>
      </BaseDrawer.Root>
    </>
  )
}

function MetaRow({
  label,
  value,
  empty,
}: {
  label: string
  value: string
  empty?: boolean
}) {
  if (empty) return null
  return (
    <div className="md-regular detail-meta-row">
      <span style={{ flex: '1 0 0' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
