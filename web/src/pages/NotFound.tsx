import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="app-page-stub wrap-center">
      <h1 className="h1">404</h1>
      <p className="lg-regular">Страница не найдена.</p>
      <Link className="h3 item" to="/">
        На главную
      </Link>
    </section>
  )
}
