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
        <span className="hud-sub">{ui.hudSub}</span>
      </div>

      <dl className="hud-read" aria-hidden="true">
        <div>
          <dt>{ui.distance}</dt>
          <dd id="hud-dist">—</dd>
        </div>
        <div>
          <dt>{ui.altitude}</dt>
          <dd id="hud-alt">—</dd>
        </div>
        <div>
          <dt>{ui.bearing}</dt>
          <dd id="hud-brg">—</dd>
        </div>
      </dl>

      <div className="hud-scroll" aria-hidden="true">
        <span>{ui.scroll}</span>
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
