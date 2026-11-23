import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

export function ThemeToggle() {
  const { toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="switcher-theme"
      onClick={toggleTheme}
      aria-label="Переключить тему"
    >
      <div className="theme-day">
        <span className="icon-day">
          <Sun size={20} strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="theme-night">
        <span className="icon-night">
          <Moon size={20} strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="switcher-background" />
    </button>
  )
}
