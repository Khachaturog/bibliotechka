import type { Card as CardType } from '../lib/data'
import { assetUrl } from '../lib/paths'
import { useUi } from '../lib/ui'

/** Grid card → quick preview drawer over the current page (no route change). */
export function Card({ card }: { card: CardType }) {
  const { openCardPreview } = useUi()

  return (
    <button
      type="button"
      className="card card-redesign"
      onClick={() => openCardPreview(card)}
    >
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
        <p className="card-title mono-title">{card.title}</p>
        {card.description ? (
          <p className="card-description mono-body">{card.description}</p>
        ) : null}
      </div>
    </button>
  )
}

export function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="skeletons-container">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card card-redesign" key={i}>
          <div className="skeleton skeleton-card-cover" />
          <div className="card-body">
            <div className="skeleton skeleton-card-title" />
            <div className="skeleton skeleton-card-description" />
          </div>
        </div>
      ))}
    </div>
  )
}
