import { Link, useLocation } from 'react-router-dom'
import { Menu as MenuIcon, Search, X } from 'lucide-react'
import { Button } from '@base-ui/react/button'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { useUi } from '../lib/ui'

type HeaderProps = {
  variant?: 'page' | 'overlay'
}

export function Header({ variant = 'page' }: HeaderProps) {
  const { pathname } = useLocation()
  const { searchOpen, drawerOpen, toggleSearch, toggleDrawer } = useUi()
  const isAbout = pathname === '/about'

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand" aria-label="Библиотечка — на главную">
          <Logo />
          <span className="site-brand-name">Библиотечка</span>
        </Link>

        {variant === 'page' ? (
          <nav className="site-nav" aria-label="Основное меню">
            <Link className={`site-nav-link${isAbout ? ' is-active' : ''}`} to="/about">
              О проекте
            </Link>
            <a
              className="site-nav-link"
              href="https://t.me/khachatur1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать
            </a>
            <a
              className="site-nav-link"
              href="https://pay.cloudtips.ru/p/3cd13ee0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Поддержать
            </a>
          </nav>
        ) : (
          <div className="site-header-spacer" />
        )}

        <div className="site-header-actions">
          <ThemeToggle />
          <Button
            className="app-icon-btn"
            aria-label={searchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
            aria-expanded={searchOpen}
            id="search-toggle"
            onClick={toggleSearch}
          >
            <span className="icon-search">
              <Search size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="icon-close">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </span>
          </Button>
          <Button
            className="app-icon-btn site-menu-btn"
            aria-label={drawerOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={drawerOpen}
            id="menu-toggle"
            onClick={toggleDrawer}
          >
            <span className="icon-burger">
              <MenuIcon size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="icon-close">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
