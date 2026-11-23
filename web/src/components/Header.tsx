import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
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
    <header className="header-0">
      <div className="header-wrap">
        <Link to="/" className="header-1" aria-label="Библиотечка — на главную">
          <Logo />
          <h1 className="h3 header-title">Библиотечка</h1>
        </Link>
      </div>

      {variant === 'page' && (
        <nav className="list-desktop" aria-label="Основное меню">
          <Link className={`h3 item${isAbout ? ' item-active' : ''}`} to="/about">
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
      )}

      <ThemeToggle />

      <button
        type="button"
        className="secondary-sm"
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
      </button>

      <button
        type="button"
        className="secondary-sm"
        aria-label={drawerOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={drawerOpen}
        id="menu-toggle"
        onClick={toggleDrawer}
      >
        <span className="icon-burger">
          <Menu size={20} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="icon-close">
          <X size={20} strokeWidth={1.75} aria-hidden />
        </span>
      </button>
    </header>
  )
}
