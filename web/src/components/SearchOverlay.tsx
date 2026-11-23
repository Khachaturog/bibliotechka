import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Input } from '@base-ui/react/input'
import { Button } from '@base-ui/react/button'
import { Link } from 'react-router-dom'
import { LayoutGrid, Search, X } from 'lucide-react'
import { useUi } from '../lib/ui'
import { getGroup, getSearchCatalog, getSubgroup, searchCards } from '../lib/data'
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

  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      document.body.classList.remove('search-open')
    }
  }, [searchOpen])

  return (
    <Dialog.Root
      open={searchOpen}
      onOpenChange={(open) => {
        if (open) openSearch()
        else {
          closeSearch()
          setQuery('')
          document.body.classList.remove('search-open')
        }
      }}
    >
      {searchOpen ? (
        <Dialog.Portal>
          <Dialog.Backdrop className="app-search-backdrop" />
          <div
            className={`search-spotlight-shell search-spotlight-shell--${mode}`}
            role="dialog"
            aria-modal="true"
            aria-label="Поиск"
          >
            <div className={`search-spotlight-panel search-spotlight-panel--${mode}`}>
              <div className="search-spotlight-top">
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
                <Button
                  className="app-icon-btn search-close-btn"
                  aria-label="Закрыть поиск"
                  onClick={closeSearch}
                >
                  <X size={20} strokeWidth={1.75} aria-hidden />
                </Button>
              </div>

              {mode === 'free' ? (
                <div className="search-free">
                  <label className="search-input-wrap" htmlFor="spotlight-query">
                    <Search
                      size={18}
                      strokeWidth={1.75}
                      className="search-input-icon"
                      aria-hidden
                    />
                    <Input
                      id="spotlight-query"
                      className="search-input"
                      type="search"
                      autoFocus
                      placeholder="Название, описание, автор…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoComplete="off"
                    />
                  </label>

                  {deferredQuery.trim().length > 0 ? (
                    <div className="search-results" role="listbox" aria-label="Результаты">
                      {results.length === 0 ? (
                        <p className="search-hint mono-body">Ничего не найдено</p>
                      ) : (
                        results.map((card) => {
                          const group = getGroup(card.group_slug || '')
                          const subgroup = getSubgroup(card.subgroup_slug)
                          const meta = [
                            group?.title_ru || group?.title_en || card.group_slug,
                            subgroup?.title_ru || subgroup?.title_en || null,
                          ]
                            .filter(Boolean)
                            .join(' · ')

                          return (
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
                                {meta ? (
                                  <span className="mono-meta search-result-meta">{meta}</span>
                                ) : null}
                                <span className="mono-title search-result-title">
                                  {card.title}
                                </span>
                                {card.description ? (
                                  <span className="mono-body search-result-desc">
                                    {card.description}
                                  </span>
                                ) : null}
                              </span>
                            </Link>
                          )
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <section
                  className="search-badge-wrap search-badge-wrap--sheet"
                  aria-label="Поиск по разделам"
                >
                  {catalog.map(({ group, subgroups }) => (
                    <div className="search-group-block" key={group.slug}>
                      <h2 className="mono-title search-group-heading">
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
      ) : null}
    </Dialog.Root>
  )
}
