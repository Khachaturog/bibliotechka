import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@base-ui/react/button'
import { CardBody } from '../components/CardBody'
import { getCardBySeo, getRandomCard } from '../lib/data'
import { appPath, cardUrl, groupUrl } from '../lib/paths'

/** Fullscreen card page — deep links and search results. Preview uses CardPreview overlay. */
export function CardDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>()
  const navigate = useNavigate()
  const card = seoSlug ? getCardBySeo(seoSlug) : undefined

  if (!seoSlug || !card) {
    return <Navigate to="/" replace />
  }

  const backTo = groupUrl(card.group_slug || '', card.subgroup_slug)

  const share = async () => {
    const path = appPath(cardUrl(card.slug, card.url_seo_yandex))
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) await navigator.share({ title: card.title, url })
      else if (navigator.clipboard) {
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
    <article className="card-full-page wrap-center">
      <div className="card-full-page-bar">
        <Button
          className="app-icon-btn"
          aria-label="Назад"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(backTo))}
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </Button>
        <Link to={backTo} className="mono-meta card-full-back-link">
          К разделу
        </Link>
      </div>
      <CardBody card={card} onShare={share} onRandom={random} />
    </article>
  )
}
