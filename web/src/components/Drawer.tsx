import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useUi } from '../lib/ui'
import { useIsMobileNav } from '../lib/media'

/** Nav sidepage: full-height side drawer / mobile bottom sheet. */
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
        <BaseDrawer.Backdrop className="app-drawer-backdrop app-drawer-backdrop--visible" />
        <BaseDrawer.Viewport
          className={`app-drawer-viewport${isMobile ? ' app-drawer-viewport--sheet' : ' app-drawer-viewport--side'}`}
        >
          <BaseDrawer.Popup
            className={`app-drawer-popup nav-drawer${isMobile ? ' app-drawer-popup--sheet' : ' app-drawer-popup--side'}${drawerOpen ? ' open' : ''}`}
            id="drawer"
          >
            <BaseDrawer.Content className="app-drawer-content nav-drawer-content">
              {isMobile ? <div className="app-drawer-handle" aria-hidden /> : null}

              <nav className="nav-drawer-links" aria-label="Мобильное меню">
                <Link
                  className={`nav-drawer-link${isAbout ? ' is-active' : ''}`}
                  to="/about"
                  onClick={closeDrawer}
                >
                  О проекте
                </Link>
                <a
                  className="nav-drawer-link"
                  href="https://t.me/khachatur1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Написать
                </a>
                <a
                  className="nav-drawer-link"
                  href="https://pay.cloudtips.ru/p/3cd13ee0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Поддержать меня
                </a>
              </nav>

              <div className="nav-drawer-theme">
                <ThemeToggle />
              </div>
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  )
}
