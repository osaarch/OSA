import { useI18n } from '../i18n'
import { world } from '../scene/world'

// The teaser shown while the sandstorm clears. The Arabic name is shown only on the Arabic page.
// Opacity is driven by --intro-text from the render loop; the copy lives in src/content.js (`intro`).
export default function Intro() {
  const { intro, ui, lang } = useI18n()
  return (
    <>
      <div className="intro" aria-hidden="true">
        {/* the Arabic name appears only on the Arabic page */}
        {lang === 'ar' && (
          <div className="intro-ar" lang="ar" dir="rtl">
            {intro.arabic}
          </div>
        )}
        <div className={`intro-en${lang === 'ar' ? '' : ' is-main'}`}>{intro.title}</div>
        <div className="intro-line">{intro.line}</div>
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
