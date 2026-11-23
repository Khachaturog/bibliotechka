import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../lib/theme'

const LABELS: Record<ThemePreference, string> = {
  system: 'Тема: системная (нажмите, чтобы сменить)',
  light: 'Тема: светлая (нажмите, чтобы сменить)',
  dark: 'Тема: тёмная (нажмите, чтобы сменить)',
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  if (preference === 'light') return <Sun size={20} strokeWidth={1.75} aria-hidden />
  if (preference === 'dark') return <Moon size={20} strokeWidth={1.75} aria-hidden />
  return <Monitor size={20} strokeWidth={1.75} aria-hidden />
}

/** Single control that cycles light → system → dark. */
export function ThemeToggle() {
  const { preference, cyclePreference } = useTheme()

  return (
    <button
      type="button"
      className={`theme-toggle secondary-sm theme-toggle--${preference}`}
      onClick={cyclePreference}
      aria-label={LABELS[preference]}
      title={LABELS[preference]}
    >
      <ThemeIcon preference={preference} />
    </button>
  )
}
