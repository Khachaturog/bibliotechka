import { getVersionsSorted, formatDateRu } from '../lib/data'

export function About() {
  const versions = getVersionsSorted()

  return (
    <section className="wrap-center" style={{ paddingTop: 24 }}>
      <div className="cards-container-0-header">
        <h1 className="h1">
          О проекте{' '}
          <span id="versions-count" className="md-regular">
            {versions.length}
          </span>
        </h1>
        <p className="lg-regular">
          История релизов Библиотечки — компас в мире дизайна.
        </p>
      </div>

      <div id="versions-container" className="versions-container">
        {versions.length === 0 ? (
          <p className="md-regular">
            Пока здесь пусто, но скоро появятся первые релизы.
          </p>
        ) : (
          versions.map((item) => (
            <article className="version-card" key={item.slug}>
              <div className="version-card-header">
                {item.version ? (
                  <p className="version-label sm-medium">Версия {item.version}</p>
                ) : null}
                {item.release_date ? (
                  <p className="version-date sm-regular">
                    {formatDateRu(item.release_date)}
                  </p>
                ) : null}
              </div>
              {item.title ? <h2 className="h2 version-title">{item.title}</h2> : null}
              {item.description ? (
                <p className="md-regular version-description">{item.description}</p>
              ) : null}
              {item.url ? (
                <a
                  className="version-link md-medium"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Подробнее
                </a>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
