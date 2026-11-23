import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type UiContextValue = {
  drawerOpen: boolean
  searchOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const openDrawer = useCallback(() => {
    setSearchOpen(false)
    setDrawerOpen(true)
  }, [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => {
    setDrawerOpen((v) => {
      const next = !v
      if (next) setSearchOpen(false)
      return next
    })
  }, [])

  const openSearch = useCallback(() => {
    setDrawerOpen(false)
    setSearchOpen(true)
  }, [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      const next = !v
      if (next) setDrawerOpen(false)
      return next
    })
  }, [])

  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen)
    document.body.classList.toggle('search-open', searchOpen)
  }, [drawerOpen, searchOpen])

  return (
    <UiContext.Provider
      value={{
        drawerOpen,
        searchOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}
    </UiContext.Provider>
  )
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}
