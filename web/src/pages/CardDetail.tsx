import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  ChevronLeft,
  Dices,
  Home,
  Share,
} from 'lucide-react'
import {
  getCardBySeo,
  getGroup,
  getRandomCard,
  getSubgroup,
} from '../lib/data'
import { appPath, assetUrl, cardUrl, groupUrl } from '../lib/paths'

export function CardDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>()
  const navigate = useNavigate()
  const card = seoSlug ? getCardBySeo(seoSlug) : undefined

  if (!seoSlug || !card) {
    return <Navigate to="/" replace />
  }

  const group = getGroup(card.group_slug || '')
  const subgroup = getSubgroup(card.subgroup_slug)
  const links = [
    { url: card.url_1, title: card.url_title_1 },
    { url: card.url_2, title: card.url_title_2 },
    { url: card.url_3, title: card.url_title_3 },
    { url: card.url_4, title: card.url_title_4 },
    { url: card.url_5, title: card.url_title_5 },
    { url: card.url_6, title: card.url_title_6 },
  ].filter((l) => Boolean(l.url))

  const authors = card.authors || []

  const share = async () => {
    const path = appPath(cardUrl(card.slug, card.url_seo_yandex))
    const url = `${window.location.origin}${path}`
    const title = card.title
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
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
      <div className="wrap-center detail-container-actions">
        <Link
          className="secondary-sm"
          to={groupUrl(card.group_slug || '', card.subgroup_slug)}
          aria-label="Назад"
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        <button type="button" className="secondary-sm" onClick={random} aria-label="Случайная">
          <Dices size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <button type="button" className="secondary-sm" onClick={share} aria-label="Поделиться">
          <Share size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="detail-container" id="detail-container-0">
        <div className="wrap-center">
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
        </div>

        <div className="wrap-center">
          <nav className="detail-breadcrumb" aria-label="Хлебные крошки" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
        </div>

        <div className="wrap-center detail-block1">
          <h1 className="h1 detail-block1-title">{card.title}</h1>
          {card.description ? (
            <div className="md-regular detail-block1-subtitle">{card.description}</div>
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
          <div className="wrap-center detail-block3">
            <div className="detail-block3-list">
              {authors.map((a) => (
                <div className="lg-regular detail-block3-author" key={a.slug}>
                  {a.title_ru || a.title_en || a.slug}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="wrap-center detail-ai">
          <div className="lg-regular detail-ai-summary">
            {card.summary_ai || 'Однажды напишет саммари'}
          </div>
          <div className="detail-ai-label-wrap">
            <div className="sm-regular detail-ai-label">Библиотечка AI</div>
          </div>
        </div>

        <div className="wrap-center detail-meta">
          <MetaRow label="Проведено" value={`${card.start_date || '—'} – ${card.end_date || '—'}`} empty={!card.start_date && !card.end_date} />
          <MetaRow label="Статья опубликована" value={card.published || '—'} empty={!card.published} />
          <MetaRow label="Номер в картотеке" value={card.slug} />
          <MetaRow label="Обновлено" value={card.updated_at || '—'} />
          <MetaRow label="Создано" value={card.created_at || '—'} />
          <MetaRow label="Раздел" value={card.group_slug || '—'} />
          <MetaRow label="Теги" value={card.detail || '—'} />
          <MetaRow label="Категория" value={card.subgroup_slug || '—'} />
          <MetaRow label="Появилось в версии" value={card.version_slug || '—'} />
          <MetaRow label="Статус" value={card.status_slug || '—'} />
        </div>
      </div>

      <div className="wrap-center detail-meta">
        <button
          type="button"
          style={{ width: '100%', borderRadius: 12 }}
          className="secondary-text-lg"
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

