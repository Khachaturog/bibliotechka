import { Dialog } from '@base-ui/react/dialog'
import { Header } from './Header'
import { useUi } from '../lib/ui'

/**
 * Search shell — group→subgroup chips land in BIB-5.
 * Base UI Dialog for open state / focus; visual language from base.css.
 */
export function SearchOverlay() {
  const { searchOpen, closeSearch, openSearch } = useUi()

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
              <p className="md-regular app-stub-note">
                Чипы group → subgroup появятся в BIB-5 (данные из JSON / Supabase).
              </p>
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
