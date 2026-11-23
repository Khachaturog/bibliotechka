import { Dialog } from '@base-ui/react/dialog'
import { Link } from 'react-router-dom'
import { Header } from './Header'
import { useUi } from '../lib/ui'
import { getSearchCatalog } from '../lib/data'
import { groupUrl } from '../lib/paths'

export function SearchOverlay() {
  const { searchOpen, closeSearch, openSearch } = useUi()
  const catalog = getSearchCatalog()

  return (
    <Dialog.Root
      open={searchOpen}
      onOpenChange={(open) => {
        if (open) openSearch()
        else closeSearch()
      }}
    >
      <Dialog.Portal>
        <div id="search" className={`search${searchOpen ? ' open' : ''}`}>
          <div className="header-wrap-start app-overlay-chrome">
            <Header variant="overlay" />
          </div>

          <div className="header-wrap-footer">
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
          </div>

          <button
            type="button"
            className="drawer-overlay"
            aria-label="Закрыть поиск"
            onClick={closeSearch}
          />
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
