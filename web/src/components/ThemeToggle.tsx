import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { useTheme, type ThemePreference } from '../lib/theme'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', Icon: Sun },
  { value: 'system', label: 'Системная', Icon: Monitor },
  { value: 'dark', label: 'Тёмная', Icon: Moon },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const current = OPTIONS.find((o) => o.value === preference) || OPTIONS[1]
  const Icon = current.Icon

  return (
    <Menu.Root>
      <Menu.Trigger
        className="app-icon-btn theme-menu-trigger"
        aria-label={`Тема: ${current.label}`}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden />
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="theme-menu-positioner" sideOffset={8} align="end">
          <Menu.Popup className="theme-menu-popup">
            <Menu.RadioGroup
              value={preference}
              onValueChange={(value) => setPreference(value as ThemePreference)}
            >
              {OPTIONS.map(({ value, label, Icon: OptIcon }) => (
                <Menu.RadioItem key={value} value={value} className="theme-menu-item">
                  <OptIcon size={16} strokeWidth={1.75} aria-hidden />
                  <span>{label}</span>
                  <Menu.RadioItemIndicator className="theme-menu-check" />
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
