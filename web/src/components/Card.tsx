import { Link } from 'react-router-dom'
import type { Card as CardType } from '../lib/data'
import { getGroup, getSubgroup } from '../lib/data'
import { assetUrl, cardUrl } from '../lib/paths'

export function Card({ card }: { card: CardType }) {
  const group = getGroup(card.group_slug || '')
  const subgroup = getSubgroup(card.subgroup_slug)
  const metaParts = [
    group?.title_ru || group?.title_en || card.group_slug,
    subgroup?.title_ru || subgroup?.title_en || null,
  ].filter(Boolean)

  return (
    <Link className="card card-redesign" to={cardUrl(card.slug, card.url_seo_yandex)}>
      <div className="card-cover-wrap">
        <img
          className="card-cover"
          src={assetUrl(card.cover_short)}
          alt={card.title}
          width={200}
          height={125}
          loading="lazy"
        />
      </div>
      <div className="card-body">
        {metaParts.length > 0 ? (
          <p className="card-meta mono-meta">{metaParts.join(' · ')}</p>
        ) : null}
        <p className="card-title mono-title">{card.title}</p>
        {card.description ? (
          <p className="card-description mono-body">{card.description}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="skeletons-container">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card card-redesign" key={i}>
          <div className="skeleton skeleton-card-cover" />
          <div className="card-body">
            <div className="skeleton skeleton-card-meta" />
            <div className="skeleton skeleton-card-title" />
            <div className="skeleton skeleton-card-description" />
          </div>
        </div>
      ))}
    </div>
  )
}
