import { useParams } from 'react-router-dom'

export function Group() {
  const { group } = useParams<{ group: string }>()

  return (
    <section className="app-page-stub">
      <h2 className="h1">/{group}</h2>
      <p className="lg-regular">
        Страница группы (badge-nav, hash, scroll-spy) — BIB-5.
      </p>
    </section>
  )
}
