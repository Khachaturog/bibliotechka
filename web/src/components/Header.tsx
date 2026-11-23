import { Link, useLocation } from 'react-router-dom'
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.16667 9.16667C4.16667 6.40917 6.40917 4.16667 9.16667 4.16667C11.9242 4.16667 14.1667 6.40917 14.1667 9.16667C14.1667 11.9242 11.9242 14.1667 9.16667 14.1667C6.40917 14.1667 4.16667 11.9242 4.16667 9.16667ZM17.2558 16.0775L14.4267 13.2475C15.3042 12.1192 15.8333 10.705 15.8333 9.16667C15.8333 5.49083 12.8425 2.5 9.16667 2.5C5.49083 2.5 2.5 5.49083 2.5 9.16667C2.5 12.8425 5.49083 15.8333 9.16667 15.8333C10.705 15.8333 12.1192 15.3042 13.2475 14.4267L16.0775 17.2558C16.24 17.4183 16.4533 17.5 16.6667 17.5C16.88 17.5 17.0933 17.4183 17.2558 17.2558C17.5817 16.93 17.5817 16.4033 17.2558 16.0775Z"
            />
          </svg>
        </span>
        <span className="icon-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.3746 10.0004L15.5482 5.82678C15.9283 5.44665 15.9283 4.83223 15.5482 4.45209C15.168 4.07196 14.5536 4.07196 14.1735 4.45209L9.99996 8.62574L5.82639 4.45209C5.44626 4.07196 4.83184 4.07196 4.45172 4.45209C4.07159 4.83223 4.07159 5.44665 4.45172 5.82678L8.62529 10.0004L4.45172 14.1741C4.07159 14.5542 4.07159 15.1687 4.45172 15.5488C4.64129 15.7384 4.89018 15.8337 5.13905 15.8337C5.38793 15.8337 5.63681 15.7384 5.82639 15.5488L9.99996 11.3752L14.1735 15.5488C14.3631 15.7384 14.612 15.8337 14.8609 15.8337C15.1097 15.8337 15.3586 15.7384 15.5482 15.5488C15.9283 15.1687 15.9283 14.5542 15.5482 14.1741L11.3746 10.0004Z"
            />
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.29024 5H16.7094C17.1444 5 17.5002 5.35583 17.5002 5.79083V5.87583C17.5002 6.31083 17.1444 6.66667 16.7094 6.66667H3.29024C2.85524 6.66667 2.50024 6.31083 2.50024 5.87583V5.79083C2.50024 5.35583 2.85524 5 3.29024 5ZM16.7094 9.16667H3.29024C2.85524 9.16667 2.50024 9.5225 2.50024 9.9575V10.0425C2.50024 10.4775 2.85524 10.8333 3.29024 10.8333H16.7094C17.1444 10.8333 17.5002 10.4775 17.5002 10.0425V9.9575C17.5002 9.5225 17.1444 9.16667 16.7094 9.16667ZM16.7094 13.3333H3.29024C2.85524 13.3333 2.50024 13.6892 2.50024 14.1242V14.2092C2.50024 14.6442 2.85524 15 3.29024 15H16.7094C17.1444 15 17.5002 14.6442 17.5002 14.2092V14.1242C17.5002 13.6892 17.1444 13.3333 16.7094 13.3333Z"
            />
          </svg>
        </span>
        <span className="icon-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.3746 10.0004L15.5482 5.82678C15.9283 5.44665 15.9283 4.83223 15.5482 4.45209C15.168 4.07196 14.5536 4.07196 14.1735 4.45209L9.99996 8.62574L5.82639 4.45209C5.44626 4.07196 4.83184 4.07196 4.45172 4.45209C4.07159 4.83223 4.07159 5.44665 4.45172 5.82678L8.62529 10.0004L4.45172 14.1741C4.07159 14.5542 4.07159 15.1687 4.45172 15.5488C4.64129 15.7384 4.89018 15.8337 5.13905 15.8337C5.38793 15.8337 5.63681 15.7384 5.82639 15.5488L9.99996 11.3752L14.1735 15.5488C14.3631 15.7384 14.612 15.8337 14.8609 15.8337C15.1097 15.8337 15.3586 15.7384 15.5482 15.5488C15.9283 15.1687 15.9283 14.5542 15.5482 14.1741L11.3746 10.0004Z"
            />
          </svg>
        </span>
      </button>
    </header>
  )
}
