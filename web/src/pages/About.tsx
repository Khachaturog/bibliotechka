import { ArrowUpRight } from 'lucide-react'
import { getVersionsSorted, formatDateRu } from '../lib/data'

export function About() {
  const versions = getVersionsSorted()

  return (
    <section className="wrap-center about-page">
      <header className="about-hero">
        <h1 className="about-title">О проекте</h1>
        <p className="mono-meta about-count">{versions.length} релизов</p>
      </header>

      <div id="versions-container" className="about-versions">
        {versions.length === 0 ? (
          <p className="mono-body">Пока здесь пусто, но скоро появятся первые релизы.</p>
        ) : (
          versions.map((item) => (
            <article className="about-version" key={item.slug}>
              <div className="about-version-meta mono-meta">
                {item.version ? <span>v{item.version}</span> : null}
                {item.release_date ? (
                  <span>{formatDateRu(item.release_date)}</span>
                ) : null}
              </div>
              {item.title ? (
                <h2 className="about-version-title mono-title">{item.title}</h2>
              ) : null}
              {item.description ? (
                <p className="about-version-desc mono-body">{item.description}</p>
              ) : null}
              {item.url ? (
                <a
                  className="about-version-link mono-meta"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Подробнее
                  <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
                </a>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
