import { scrollMax } from '../journey'
import { flyTo } from '../router'

// Quiet instrument layer that lives over the 3D journey. Everything here is driven
// by CSS variables written from the render loop (--intro, --menu, --p), so it
// costs nothing per frame and reverses perfectly with the scroll.
export default function Hud({ onReplay }) {
  return (
    <div className="hud" aria-hidden={false}>
      <div className="hud-top">
        <span className="hud-title">Al-Malwiya</span>
        <span className="hud-sub">Samarra, Iraq</span>
      </div>

      <dl className="hud-read" aria-hidden="true">
        <div>
          <dt>Distance</dt>
          <dd id="hud-dist">—</dd>
        </div>
        <div>
          <dt>Altitude</dt>
          <dd id="hud-alt">—</dd>
        </div>
        <div>
          <dt>Bearing</dt>
          <dd id="hud-brg">—</dd>
        </div>
      </dl>

      <div className="hud-scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>

      <button className="hud-skip" type="button" onClick={() => flyTo(scrollMax(), 3600)}>
        Skip journey
      </button>

      <button className="hud-replay" type="button" onClick={onReplay}>
        <span aria-hidden="true">↑</span> Fly back
      </button>

      <div className="rail" aria-hidden="true">
        <i />
      </div>
    </div>
  )
}
