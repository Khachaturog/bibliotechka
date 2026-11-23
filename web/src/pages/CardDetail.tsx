import { useParams } from 'react-router-dom'

export function CardDetail() {
  const { seoSlug } = useParams<{ seoSlug: string }>()

  return (
    <section className="app-page-stub">
      <h2 className="h1">Карточка</h2>
      <p className="lg-regular md-regular">
        <code>{seoSlug}</code> — detail UX в BIB-5.
      </p>
    </section>
  )
}
