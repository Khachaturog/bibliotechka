import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { Link, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { ThemeToggle } from './ThemeToggle'
import { useUi } from '../lib/ui'
import { useIsMobileNav } from '../lib/media'

/** Nav sidepage: side drawer on wide screens, bottom-sheet on mobile. */
export function Drawer() {
  const { drawerOpen, closeDrawer, openDrawer } = useUi()
  const { pathname } = useLocation()
  const isAbout = pathname === '/about'
  const isMobile = useIsMobileNav()
  const swipeDirection = isMobile ? 'down' : 'right'

  return (
    <BaseDrawer.Root
      open={drawerOpen}
      swipeDirection={swipeDirection}
      onOpenChange={(open) => {
        if (open) openDrawer()
        else closeDrawer()
      }}
    >
      <BaseDrawer.Portal>
        <BaseDrawer.Backdrop className="app-drawer-backdrop" />
        <BaseDrawer.Viewport
          className={`app-drawer-viewport${isMobile ? ' app-drawer-viewport--sheet' : ' app-drawer-viewport--side'}`}
        >
          <BaseDrawer.Popup
            className={`app-drawer-popup${isMobile ? ' app-drawer-popup--sheet' : ' app-drawer-popup--side'}${drawerOpen ? ' open' : ''}`}
            id="drawer"
          >
            <BaseDrawer.Content className="app-drawer-content">
              {isMobile ? <div className="app-drawer-handle" aria-hidden /> : null}

              <div className="header-wrap-start app-overlay-chrome">
                <Header variant="overlay" />
              </div>

              <div className="header-wrap-center">
                <nav className="list-mobile" aria-label="Мобильное меню">
                  <Link
                    className={`h3 item${isAbout ? ' item-active' : ''}`}
                    to="/about"
                    onClick={closeDrawer}
                  >
                    О проекте
                  </Link>
                  <a
                    className="h3 item"
                    href="https://t.me/khachatur1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Написать
                  </a>
                  <a
                    className="h3 item"
                    href="https://pay.cloudtips.ru/p/3cd13ee0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Поддержать меня
                  </a>
                </nav>
              </div>

              <div className="header-wrap-center">
                <ThemeToggle />
              </div>
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  )
}
