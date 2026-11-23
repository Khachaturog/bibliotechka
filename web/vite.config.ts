import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Public path: `/bibliotechka-4/` on GH Pages project preview; `/` after custom-domain cutover. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let base = env.VITE_BASE || '/'
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`

  return {
    plugins: [react()],
    base,
  }
})
