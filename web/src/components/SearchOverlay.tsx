import { useDeferredValue, useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Link } from 'react-router-dom'
import { Search, LayoutGrid } from 'lucide-react'
import { Header } from './Header'
import { useUi } from '../lib/ui'
import { getSearchCatalog, searchCards } from '../lib/data'
import { assetUrl, cardUrl, groupUrl } from '../lib/paths'

type SearchMode = 'free' | 'tabs'

export function SearchOverlay() {
  const { searchOpen, closeSearch, openSearch } = useUi()
  const catalog = getSearchCatalog()
  const [mode, setMode] = useState<SearchMode>('free')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const results = useMemo(
    () => (mode === 'free' ? searchCards(deferredQuery) : []),
    [mode, deferredQuery],
  )

  return (
    <Dialog.Root
      open={searchOpen}
      onOpenChange={(open) => {
        if (open) openSearch()
        else {
          closeSearch()
          setQuery('')
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="app-search-backdrop" />
        <div id="search" className={`search search-spotlight${searchOpen ? ' open' : ''}`}>
          <div className="header-wrap-start app-overlay-chrome">
            <Header variant="overlay" />
          </div>

          <div className="search-spotlight-panel">
            <div className="search-mode-switch" role="tablist" aria-label="Режим поиска">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'free'}
                className={`search-mode-btn${mode === 'free' ? ' is-active' : ''}`}
                onClick={() => setMode('free')}
              >
                <Search size={16} strokeWidth={1.75} aria-hidden />
                Свободный поиск
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'tabs'}
                className={`search-mode-btn${mode === 'tabs' ? ' is-active' : ''}`}
                onClick={() => setMode('tabs')}
              >
                <LayoutGrid size={16} strokeWidth={1.75} aria-hidden />
                Разделы
              </button>
            </div>

            {mode === 'free' ? (
              <div className="search-free">
                <label className="search-input-wrap" htmlFor="spotlight-query">
                  <Search size={18} strokeWidth={1.75} className="search-input-icon" aria-hidden />
                  <input
                    id="spotlight-query"
                    className="search-input"
                    type="search"
                    autoFocus={searchOpen && mode === 'free'}
                    placeholder="Название, описание, автор…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                  />
                </label>

                <div className="search-results" role="listbox" aria-label="Результаты">
                  {deferredQuery.trim().length === 0 ? (
                    <p className="search-hint mono-body">Начните вводить — поиск по каталогу</p>
                  ) : results.length === 0 ? (
                    <p className="search-hint mono-body">Ничего не найдено</p>
                  ) : (
                    results.map((card) => (
                      <Link
                        key={card.slug}
                        role="option"
                        className="search-result-row"
                        to={cardUrl(card.slug, card.url_seo_yandex)}
                        onClick={closeSearch}
                      >
                        <img
                          className="search-result-cover"
                          src={assetUrl(card.cover_short)}
                          alt=""
                          width={56}
                          height={36}
                          loading="lazy"
                        />
                        <span className="search-result-text">
                          <span className="mono-title search-result-title">{card.title}</span>
                          {card.description ? (
                            <span className="mono-body search-result-desc">{card.description}</span>
                          ) : null}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <section className="search-badge-wrap" aria-label="Поиск по разделам">
                {catalog.map(({ group, subgroups }) => (
                  <div className="search-group-block" key={group.slug}>
                    <h2 className="h3 group-title" style={{ marginLeft: 4 }}>
                      {group.title_ru || group.title_en || group.slug}
                    </h2>
                    <div className="subgroup-badges">
                      {subgroups.map((sg) => (
                        <Link
                          key={sg.slug}
                          className="chip-neutral-label-small"
                          to={groupUrl(group.slug, sg.slug)}
                          onClick={closeSearch}
                        >
                          {sg.title_ru || sg.title_en || sg.slug}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
