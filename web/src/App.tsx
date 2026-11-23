import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { UiProvider } from './lib/ui'
import { AppRoutes } from './routes'

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider>
      <UiProvider>{children ?? <AppRoutes />}</UiProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
