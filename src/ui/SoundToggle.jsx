import { audio, useAudio } from '../audio'

// Always-available sound control: music on / off. (The wind and sand layers are part
// of the soundtrack and fade out by themselves when the dust is gone.)
export default function SoundToggle() {
  const { on } = useAudio()
  return (
    <button
      className={`sound${on ? ' is-on' : ''}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Sound on — click to turn the music off' : 'Sound off — click to turn the music on'}
      onClick={() => audio.toggle()}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-label">Sound {on ? 'on' : 'off'}</span>
    </button>
  )
}
