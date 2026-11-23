import { Link } from 'react-router-dom'
import type { Card as CardType } from '../lib/data'
import { assetUrl, cardUrl } from '../lib/paths'

export function Card({ card }: { card: CardType }) {
  return (
    <Link className="card" to={cardUrl(card.slug, card.url_seo_yandex)}>
      <img
        className="card-cover"
        src={assetUrl(card.cover_short)}
        alt={card.title}
        width={200}
        height={125}
        loading="lazy"
      />
      <p className="lg-medium card-title">{card.title}</p>
      {card.description ? (
        <p className="md-regular card-description">{card.description}</p>
      ) : (
        <p className="md-regular card-description" hidden />
      )}
    </Link>
  )
}

export function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="skeletons-container">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-card-cover" />
          <div className="skeleton skeleton-card-title" />
          <div className="skeleton skeleton-card-description" />
        </div>
      ))}
    </div>
  )
}
