import { audio, useAudio } from '../audio'
import { useI18n } from '../i18n'

// Always-available sound control: music on / off. (The wind and sand layers are part
// of the soundtrack and fade out by themselves when the dust is gone.)
export default function SoundToggle() {
  const { on } = useAudio()
  const { ui } = useI18n()
  return (
    <button
      className={`sound${on ? ' is-on' : ''}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? ui.soundOnAria : ui.soundOffAria}
      onClick={() => audio.toggle()}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-label">{on ? ui.soundOn : ui.soundOff}</span>
    </button>
  )
}
