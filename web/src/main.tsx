import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/app.css'
import App from './App'

const rootEl = document.getElementById('root')!

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree)
} else {
  createRoot(rootEl).render(tree)
}
