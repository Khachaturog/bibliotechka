import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Group } from './pages/Group'
import { CardDetail } from './pages/CardDetail'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'

/**
 * URL parity with PHP site:
 * `/`, `/{group}`, `/card/{url_seo_yandex}`, `/about`
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="about.html" element={<Navigate to="/about" replace />} />
        <Route path="card/:seoSlug" element={<CardDetail />} />
        <Route path=":group" element={<Group />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
