import { useNavigate } from 'react-router-dom'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { CardBody } from './CardBody'
import { getRandomCard } from '../lib/data'
import { appPath, cardUrl } from '../lib/paths'
import { useIsMobileNav } from '../lib/media'
import { useUi } from '../lib/ui'

/** Quick preview drawer over current page (home/group) — does not change the route. */
export function CardPreview() {
  const { previewCard, closeCardPreview, setPreviewCard } = useUi()
  const navigate = useNavigate()
  const isMobile = useIsMobileNav()
  const open = Boolean(previewCard)

  if (!previewCard) return null

  const card = previewCard

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
    if (next) setPreviewCard(next)
  }

  const expand = () => {
    navigate(cardUrl(card.slug, card.url_seo_yandex))
  }

  return (
    <BaseDrawer.Root
      open={open}
      swipeDirection={isMobile ? 'down' : 'right'}
      onOpenChange={(next) => {
        if (!next) closeCardPreview()
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
                onClose={closeCardPreview}
                onShare={share}
                onRandom={random}
                onExpand={expand}
                closeIcon={isMobile ? 'x' : 'back'}
                compact
              />
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  )
}
