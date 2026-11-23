import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="app-page-stub">
      <h2 className="h1">404</h2>
      <p className="lg-regular">Страница не найдена.</p>
      <p>
        <Link className="h3 item" to="/">
          На главную
        </Link>
      </p>
    </section>
  )
}
