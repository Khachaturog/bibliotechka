import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import type { Card } from './data'

type UiContextValue = {
  drawerOpen: boolean
  searchOpen: boolean
  previewCard: Card | null
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  openCardPreview: (card: Card) => void
  closeCardPreview: () => void
  setPreviewCard: (card: Card | null) => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [previewCard, setPreviewCard] = useState<Card | null>(null)
  const location = useLocation()

  const openDrawer = useCallback(() => {
    setSearchOpen(false)
    setPreviewCard(null)
    setDrawerOpen(true)
  }, [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => {
    setDrawerOpen((v) => {
      const next = !v
      if (next) {
        setSearchOpen(false)
        setPreviewCard(null)
      }
      return next
    })
  }, [])

  const openSearch = useCallback(() => {
    setDrawerOpen(false)
    setPreviewCard(null)
    setSearchOpen(true)
  }, [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      const next = !v
      if (next) {
        setDrawerOpen(false)
        setPreviewCard(null)
      }
      return next
    })
  }, [])

  const openCardPreview = useCallback((card: Card) => {
    setDrawerOpen(false)
    setSearchOpen(false)
    setPreviewCard(card)
  }, [])
  const closeCardPreview = useCallback(() => setPreviewCard(null), [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('drawer-open', drawerOpen)
    document.body.classList.toggle('search-open', searchOpen)
    document.body.classList.toggle('preview-open', Boolean(previewCard))
  }, [drawerOpen, searchOpen, previewCard])

  // Dismiss overlays when the route changes (e.g. search → fullscreen card)
  useEffect(() => {
    setSearchOpen(false)
    setDrawerOpen(false)
    setPreviewCard(null)
  }, [location.pathname, location.search, location.hash])

  return (
    <UiContext.Provider
      value={{
        drawerOpen,
        searchOpen,
        previewCard,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        openSearch,
        closeSearch,
        toggleSearch,
        openCardPreview,
        closeCardPreview,
        setPreviewCard,
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
