import { Dialog } from '@base-ui/react/dialog'
import { Link, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { ThemeToggle } from './ThemeToggle'
import { useUi } from '../lib/ui'

/** Mobile nav shell — Base UI Dialog + existing drawer CSS. */
export function Drawer() {
  const { drawerOpen, closeDrawer, openDrawer } = useUi()
  const { pathname } = useLocation()
  const isAbout = pathname === '/about'

  return (
    <Dialog.Root
      open={drawerOpen}
      onOpenChange={(open) => {
        if (open) openDrawer()
        else closeDrawer()
      }}
    >
      <Dialog.Portal>
        <div id="drawer" className={`drawer${drawerOpen ? ' open' : ''}`}>
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

          <button
            type="button"
            className="drawer-overlay"
            aria-label="Закрыть меню"
            onClick={closeDrawer}
          />
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
