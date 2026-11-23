import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Drawer } from './Drawer'
import { SearchOverlay } from './SearchOverlay'

export function Layout() {
  return (
    <div className="app-shell">
      <div className="app-frame">
        <Header />
        <main className="app-main">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Drawer />
      <SearchOverlay />
    </div>
  )
}
