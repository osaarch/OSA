import { toggleLang, useLang } from '../i18n'

// EN / AR — sits next to the sound button. The current language is the bright one.
export default function LangToggle() {
  const lang = useLang()
  return (
    <button
      className="lang"
      type="button"
      lang="en"
      aria-label={lang === 'ar' ? 'Language: Arabic — switch to English' : 'Language: English — switch to Arabic'}
      onClick={toggleLang}
    >
      <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
      <i aria-hidden="true">/</i>
      <span className={lang === 'ar' ? 'is-on' : ''}>AR</span>
    </button>
  )
}
