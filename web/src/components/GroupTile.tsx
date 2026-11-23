import { Link } from 'react-router-dom'
import type { Group } from '../lib/data'
import { assetUrl, groupUrl } from '../lib/paths'

export function GroupTile({ group }: { group: Group }) {
  const title = group.title_ru || group.title_en || group.slug
  const description = group.description_ru || ''

  return (
    <Link className="group" to={groupUrl(group.slug)}>
      <div className="group-cover-wrap">
        <img
          className="group-cover"
          src={assetUrl(group.cover)}
          alt={title}
          loading="lazy"
        />
      </div>
      <div className="group-content">
        <p className="h2 group-title">{title}</p>
        {description ? (
          <p className="md-regular group-description">{description}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function GroupSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="skeletons-container">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-group" key={i}>
          <div className="skeleton skeleton-group-cover" />
          <div className="skeleton skeleton-group-title" />
        </div>
      ))}
    </div>
  )
}
