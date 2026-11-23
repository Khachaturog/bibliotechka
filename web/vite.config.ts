import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Public path for assets + Router basename.
 * Prefer process.env (CI `VITE_BASE`) over .env files.
 * CI uses `/bibliotechka-4/` for github.io preview until DNS cutover;
 * then `/` for bibliotechka.site root.
 */
function resolveBase(mode: string): string {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  let base = process.env.VITE_BASE || fileEnv.VITE_BASE || '/'
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig(({ mode }) => {
  const base = resolveBase(mode)
  return {
    plugins: [react()],
    base,
  }
})
