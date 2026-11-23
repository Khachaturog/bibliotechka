import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../lib/theme'

const LABELS: Record<ThemePreference, string> = {
  system: 'Системная тема',
  light: 'Светлая тема',
  dark: 'Тёмная тема',
}

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      className={`theme-switcher theme-switcher--${preference}`}
      role="group"
      aria-label="Тема оформления"
    >
      <button
        type="button"
        className={`theme-switcher-btn${preference === 'light' ? ' is-active' : ''}`}
        aria-label={LABELS.light}
        aria-pressed={preference === 'light'}
        onClick={() => setPreference('light')}
      >
        <Sun size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        className={`theme-switcher-btn${preference === 'system' ? ' is-active' : ''}`}
        aria-label={LABELS.system}
        aria-pressed={preference === 'system'}
        onClick={() => setPreference('system')}
      >
        <Monitor size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        className={`theme-switcher-btn${preference === 'dark' ? ' is-active' : ''}`}
        aria-label={LABELS.dark}
        aria-pressed={preference === 'dark'}
        onClick={() => setPreference('dark')}
      >
        <Moon size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <span className="theme-switcher-thumb" aria-hidden />
    </div>
  )
}
