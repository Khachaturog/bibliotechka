import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@base-ui/react/button'
import { CardBody } from '../components/CardBody'
import { getCardBySeo, getRandomCard } from '../lib/data'
import { appPath, cardUrl, groupUrl } from '../lib/paths'
import { useIsMobileNav } from '../lib/media'

type LocationState = { preview?: boolean } | null

export function CardDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobileNav()
  const card = seoSlug ? getCardBySeo(seoSlug) : undefined
  const preview = Boolean((location.state as LocationState)?.preview)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(true)
  }, [seoSlug, preview])

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
    if (next) {
      navigate(cardUrl(next.slug, next.url_seo_yandex), {
        state: preview ? { preview: true } : undefined,
      })
    }
  }

  const dismiss = () => {
    setOpen(false)
    window.setTimeout(() => {
      if (window.history.length > 1) navigate(-1)
      else navigate(backTo)
    }, 180)
  }

  // Fullscreen page (from search / deep link)
  if (!preview) {
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

  // Quick preview drawer (from grid)
  return (
    <>
      <div className="card-detail-ssr-shell" aria-hidden>
        <h1 className="h1">{card.title}</h1>
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
              className={`app-drawer-popup card-detail-drawer${
                isMobile
                  ? ' app-drawer-popup--sheet card-detail-drawer--sheet'
                  : ' app-drawer-popup--side card-detail-drawer--side'
              }${open ? ' open' : ''}`}
            >
              <BaseDrawer.Content className="app-drawer-content card-detail-drawer-content">
                {isMobile ? <div className="app-drawer-handle" aria-hidden /> : null}
                <CardBody
                  card={card}
                  onClose={dismiss}
                  onShare={share}
                  onRandom={random}
                  closeIcon={isMobile ? 'x' : 'back'}
                  compact
                />
              </BaseDrawer.Content>
            </BaseDrawer.Popup>
          </BaseDrawer.Viewport>
        </BaseDrawer.Portal>
      </BaseDrawer.Root>
    </>
  )
}
