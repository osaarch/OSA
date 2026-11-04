import { useMemo, useSyncExternalStore } from 'react'
import { getContent } from './content'

// ─────────────────────────────────────────────────────────────────────────────
//  AR / EN.  English is the default; the visitor's choice is remembered.
//  `?lang=ar` in the address opens the Arabic version directly.
//  The page layout keeps its geometry; in Arabic the text itself runs right-to-left
//  (see the html[lang='ar'] rules at the end of styles.css).
// ─────────────────────────────────────────────────────────────────────────────
const KEY = 'osa-lang'
const store = {
  get() {
    try {
      return localStorage.getItem(KEY)
    } catch (e) {
      return null
    }
  },
  put(v) {
    try {
      localStorage.setItem(KEY, v)
    } catch (e) {
      /* private mode: the choice simply is not remembered */
    }
  },
}

const fromUrl = () => {
  const m = /[?&]lang=(ar|en)\b/.exec(window.location.search)
  return m ? m[1] : null
}

let lang = fromUrl() || (store.get() === 'ar' ? 'ar' : 'en')
const listeners = new Set()

function apply() {
  const root = document.documentElement
  root.lang = lang
  root.classList.toggle('is-ar', lang === 'ar')
}
apply()

export const getLang = () => lang
export function setLang(next) {
  if (next !== 'ar' && next !== 'en') return
  if (next === lang) return
  lang = next
  store.put(next)
  apply()
  listeners.forEach((l) => l())
}
export const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar')

export function useLang() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => lang,
  )
}

// ── interface strings ────────────────────────────────────────────────────────
const STR = {
  en: {
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundOnAria: 'Sound on — click to turn the music off',
    soundOffAria: 'Sound off — click to turn the music on',
    langAria: 'Language: English — switch to Arabic',
    bestWithSound: 'Best experienced with sound',
    enterSound: 'Enter with sound',
    enterSilent: 'Enter without',
    loadingMalwiya: 'Loading the Malwiya',
    loadError: 'The 3D model could not be loaded',
    skip: 'Skip',
    skipJourney: 'Skip journey',
    flyBack: 'Fly back',
    flyBackMalwiya: 'Fly back to the Malwiya',
    scroll: 'Scroll',
    distance: 'Distance',
    altitude: 'Altitude',
    bearing: 'Bearing',
    hudTitle: 'Al-Malwiya',
    hudSub: 'Samarra, Iraq',
    noWebgl: '3D view unavailable on this device.',
    openProject: 'Open project',
    allWorks: 'All works',
    nextProject: 'Next project',
    overview: 'Project Overview',
    concept: 'Architectural Concept',
    formGeneration: 'Form Generation',
    loadingStadium: 'Loading the stadium',
    journeyAria: '3D journey',
    notFound: 'This project does not exist.',
    backToWorks: 'Back to works',
    placeholderNote: 'Placeholder project — add photographs to its folder in src/assets/projects/ and edit src/content.js.',
    meta: { year: 'Year', location: 'Location', type: 'Type', format: 'Format', status: 'Status', area: 'Area', role: 'Role' },
    biography: 'Biography',
    philosophy: 'Architectural philosophy',
    areas: 'Areas of work',
    contact: 'Contact',
    viewWorks: 'View the works',
    portraitAlt: 'Portrait of Osama',
    unit: 'm',
    chapters: ['A Landscape of Fragments', 'River and Architecture', 'Emerging from the Ground', 'Inside the Bowl'],
  },
  ar: {
    soundOn: 'الصوت مفعّل',
    soundOff: 'الصوت مغلق',
    soundOnAria: 'الصوت مفعّل — اضغط لإيقاف الموسيقى',
    soundOffAria: 'الصوت مغلق — اضغط لتشغيل الموسيقى',
    langAria: 'اللغة: العربية — التبديل إلى الإنجليزية',
    bestWithSound: 'التجربة أفضل مع الصوت',
    enterSound: 'ادخل بالصوت',
    enterSilent: 'ادخل بدون صوت',
    loadingMalwiya: 'جارٍ تحميل الملوية',
    loadError: 'تعذّر تحميل المجسّم ثلاثي الأبعاد',
    skip: 'تخطَّ',
    skipJourney: 'تخطَّ الرحلة',
    flyBack: 'العودة للأعلى',
    flyBackMalwiya: 'العودة إلى الملوية',
    scroll: 'مرِّر',
    distance: 'المسافة',
    altitude: 'الارتفاع',
    bearing: 'الاتجاه',
    hudTitle: 'الملوية',
    hudSub: 'سامراء، العراق',
    noWebgl: 'العرض ثلاثي الأبعاد غير متاح على هذا الجهاز.',
    openProject: 'افتح المشروع',
    allWorks: 'كل الأعمال',
    nextProject: 'المشروع التالي',
    overview: 'نظرة عامة على المشروع',
    concept: 'الفكرة المعمارية',
    formGeneration: 'توليد الشكل',
    loadingStadium: 'جارٍ تحميل الملعب',
    journeyAria: 'رحلة ثلاثية الأبعاد',
    notFound: 'هذا المشروع غير موجود.',
    backToWorks: 'العودة إلى الأعمال',
    placeholderNote: 'مشروع تجريبي — أضف الصور إلى مجلّده في src/assets/projects/ وعدّل src/content.js.',
    meta: { year: 'السنة', location: 'الموقع', type: 'النوع', format: 'الصيغة', status: 'الحالة', area: 'المساحة', role: 'الدور' },
    biography: 'نبذة عني',
    philosophy: 'فلسفتي المعمارية',
    areas: 'مجالات العمل',
    contact: 'التواصل',
    viewWorks: 'تصفّح الأعمال',
    portraitAlt: 'صورة أسامة',
    unit: 'م',
    chapters: ['مشهد من الشظايا', 'النهر والعمارة', 'ينبثق من الأرض', 'داخل المدرّج'],
  },
}

export const strings = (l) => STR[l] || STR.en
export const tNow = () => STR[lang]

// One hook for a component: the strings and the content of the current language.
export function useI18n() {
  const l = useLang()
  return useMemo(() => ({ lang: l, ui: strings(l), ...getContent(l) }), [l])
}
