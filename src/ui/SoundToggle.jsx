import { audio, useAudio } from '../audio'
import { useI18n } from '../i18n'

// Always-available sound control: music on / off, and a volume slider beside it. (The wind and sand
// layers are part of the soundtrack and fade out by themselves when the dust is gone.)
// Moving the slider up from silence switches the sound on.
export default function SoundToggle() {
  const { on, volume } = useAudio()
  const { ui } = useI18n()
  return (
    <div className={`sound-wrap${on ? ' is-on' : ''}`}>
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
      <input
        className="vol"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(volume * 100)}
        style={{ '--v': `${Math.round(volume * 100)}%` }}
        aria-label={ui.volume}
        onChange={(e) => {
          const v = Number(e.target.value) / 100
          audio.setVolume(v)
          if (v > 0 && !on) audio.enable()
        }}
      />
    </div>
  )
}
