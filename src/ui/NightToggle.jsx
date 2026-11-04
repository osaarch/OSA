import { toggleNight, useNight } from '../night'
import { useI18n } from '../i18n'

// Night mode: moonlit darkness and rain, for the Malwiya and the stadium. A small moon —
// filled while night is on. It sits with the sound and language controls.
export default function NightToggle() {
  const on = useNight()
  const { ui } = useI18n()
  return (
    <button
      className={`night-btn${on ? ' is-on' : ''}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? ui.nightOnAria : ui.nightOffAria}
      title={on ? ui.nightOn : ui.nightOff}
      onClick={toggleNight}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
        <path
          d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="night-label">{on ? ui.nightOn : ui.nightOff}</span>
    </button>
  )
}
