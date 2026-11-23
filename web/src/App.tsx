import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { UiProvider } from './lib/ui'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UiProvider>
          <AppRoutes />
        </UiProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
