import { useI18n } from '../i18n'
import { world } from '../scene/world'

// The teaser shown while the sandstorm clears: just the name, in the language of the page.
// Opacity is driven by --intro-text from the render loop; the copy lives in src/content.js (`intro`).
export default function Intro() {
  const { intro, ui, lang } = useI18n()
  return (
    <>
      <div className="intro" aria-hidden="true">
        {lang === 'ar' ? (
          <div className="intro-ar" lang="ar" dir="rtl">
            {intro.arabic}
          </div>
        ) : (
          <div className="intro-en">{intro.title}</div>
        )}
      </div>
      <button
        className="intro-skip"
        type="button"
        onClick={() => {
          world.introSkip = true
        }}
      >
        {ui.skip}
      </button>
    </>
  )
}
