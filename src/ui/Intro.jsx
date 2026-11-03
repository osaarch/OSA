import { intro } from '../content'
import { world } from '../scene/world'

// The teaser shown while the sandstorm clears. Opacity is driven by --intro-text from
// the render loop; the copy lives in src/content.js (`intro`).
export default function Intro() {
  return (
    <>
      <div className="intro" aria-hidden="true">
        <div className="intro-ar" lang="ar" dir="rtl">
          {intro.arabic}
        </div>
        <div className="intro-en">{intro.title}</div>
        <div className="intro-line">{intro.line}</div>
      </div>
      <button
        className="intro-skip"
        type="button"
        onClick={() => {
          world.introSkip = true
        }}
      >
        Skip
      </button>
    </>
  )
}
