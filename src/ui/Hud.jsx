import { scrollMax } from '../journey'
import { flyTo } from '../router'
import { useI18n } from '../i18n'

// Quiet instrument layer that lives over the 3D journey. Everything here is driven
// by CSS variables written from the render loop (--intro, --menu, --p), so it
// costs nothing per frame and reverses perfectly with the scroll.
export default function Hud({ onReplay }) {
  const { ui } = useI18n()
  return (
    <div className="hud" aria-hidden={false}>
      <div className="hud-top">
        <span className="hud-title">{ui.hudTitle}</span>
      </div>

      <div className="hud-scroll" aria-hidden="true">
        <i />
      </div>

      <button className="hud-skip" type="button" onClick={() => flyTo(scrollMax(), 3600)}>
        {ui.skipJourney}
      </button>

      <button className="hud-replay" type="button" onClick={onReplay}>
        <span aria-hidden="true">↑</span> {ui.flyBack}
      </button>

      <div className="rail" aria-hidden="true">
        <i />
      </div>
    </div>
  )
}
