import { THEMES, cycleTheme, useTheme } from '../night'
import { useI18n } from '../i18n'

// The theme switch: day → night (moonlit, rain) → dark (black and earth-amber light) → day.
// One small button on the sound / language rail; the icon and the word say which one is on.
const ICON = {
  // a sun
  day: (
    <>
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  // a black disc inside a thin ring: an eclipse
  dark: (
    <>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.2" fill="currentColor" />
    </>
  ),
  // the moon
  night: (
    <path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  ),
}

export default function NightToggle() {
  const theme = useTheme()
  const { ui } = useI18n()
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
  const label = { day: ui.themeDay, dark: ui.themeDark, night: ui.themeNight }
  return (
    <button
      className={`night-btn${theme !== 'day' ? ' is-on' : ''}`}
      data-theme={theme}
      type="button"
      aria-label={`${label[theme]} — ${ui.themeNext}: ${label[next]}`}
      title={`${label[theme]} → ${label[next]}`}
      onClick={cycleTheme}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        {ICON[theme]}
      </svg>
      <span className="night-label">{label[theme]}</span>
    </button>
  )
}
