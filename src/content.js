// ═════════════════════════════════════════════════════════════════════════════
//  ALL OF THE SITE'S PERSONAL CONTENT LIVES IN THIS FILE.
//
//  The entries below are PLACEHOLDERS. Replace the text with your own, drop your
//  photographs into the folders described in README.md, and delete the line
//  `placeholder: true` from `profile`. Nothing else in the code needs to change.
// ═════════════════════════════════════════════════════════════════════════════

// ── Image discovery ──────────────────────────────────────────────────────────
// Any image dropped in  src/assets/profile/        is picked up for the portrait
// Any image dropped in  src/assets/projects/<slug>/ is picked up for that project
// (files are ordered by name: cover.jpg first if present, then 01.jpg, 02.jpg …)
const profileFiles = import.meta.glob('./assets/profile/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const projectFiles = import.meta.glob('./assets/projects/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byName = (a, b) => a.file.localeCompare(b.file, undefined, { numeric: true })

function profileImage() {
  const files = Object.entries(profileFiles)
    .map(([p, url]) => ({ file: p.split('/').pop(), url }))
    .sort(byName)
  const pick = files.find((f) => /^portrait\./i.test(f.file)) || files[0]
  return pick ? pick.url : null
}

function projectImages(slug, captions = {}) {
  const all = Object.entries(projectFiles)
    .filter(([p]) => p.includes(`/projects/${slug}/`))
    .map(([p, url]) => ({ file: p.split('/').pop(), url }))
    .sort(byName)
  // cover.jpg is the hero image; without one, the first file is used.
  const coverFile = all.find((f) => /^cover\./i.test(f.file)) || all[0] || null
  return {
    cover: coverFile ? coverFile.url : null,
    gallery: all
      .filter((f) => f !== coverFile)
      .map((f) => ({ src: f.url, caption: captions[f.file] || '' })),
    count: all.length,
  }
}

// ── INTRO  (the sandstorm teaser shown before the journey) ───────────────────
export const intro = {
  arabic: 'الملوية',
  title: 'AL-MALWIYA',
  line: 'Beyond the dust, a spiral rises.',
}

// ── PROFILE  (the OSA page) ──────────────────────────────────────────────────
export const profile = {
  placeholder: true, // ← delete this line once the content below is yours

  name: 'Your Full Name',
  title: 'Architect',
  location: 'City, Country',
  portrait: profileImage(), // src/assets/profile/portrait.jpg
  portraitCaption: '',

  // one-line professional identity, shown under the name
  identity: 'A single sentence that says who you are as an architect.',

  biography: [
    'Write your biography here. Two or three short paragraphs work best: where you studied, where you practise, what you are known for.',
    'Each string in this list becomes one paragraph on the page.',
  ],

  philosophy: {
    statement: 'Your architectural philosophy in one sentence.',
    paragraphs: [
      'Expand on your philosophy here — your approach to material, light, place, memory, structure.',
    ],
  },

  // facts about you, shown as a quiet two-column list
  details: [
    { label: 'Practice', value: 'Studio or office name' },
    { label: 'Education', value: 'Degree, university, year' },
    { label: 'Focus', value: 'Heritage · housing · public space' },
    { label: 'Recognition', value: 'Awards, publications, exhibitions' },
  ],

  contact: [
    { label: 'Instagram', value: '@osa.arch', href: 'https://instagram.com/osa.arch' },
    { label: 'Phone', value: '07749998299', href: 'tel:+9647749998299' },
    // { label: 'Email', value: 'name@example.com', href: 'mailto:name@example.com' },
  ],
}

// ── PROJECTS  (the WORKS page and one detail page per project) ───────────────
// `slug` must match the folder name in src/assets/projects/<slug>/
const projectData = [
  {
    slug: 'project-one',
    title: 'Project One',
    year: '2025',
    location: 'City, Country',
    type: 'Typology',
    status: 'Built',
    area: '000 m²',
    role: 'Lead architect',
    summary: 'A short line that introduces the project.',
    description: [
      'Describe the project here: the brief, the site, the idea, the materials and the outcome.',
      'Each string in this list becomes one paragraph on the project page.',
    ],
    captions: {}, // { '01.jpg': 'Caption for this image' }
  },
  {
    slug: 'project-two',
    title: 'Project Two',
    year: '2024',
    location: 'City, Country',
    type: 'Typology',
    status: 'Competition',
    area: '000 m²',
    role: 'Design team',
    summary: 'A short line that introduces the project.',
    description: ['Describe the project here.'],
    captions: {},
  },
]

export const projects = projectData.map((p, i) => {
  const imgs = projectImages(p.slug, p.captions)
  return {
    ...p,
    index: i,
    number: String(i + 1).padStart(2, '0'),
    cover: imgs.cover,
    gallery: imgs.gallery,
    hasImages: imgs.count > 0,
  }
})

export const findProject = (slug) => projects.find((p) => p.slug === slug)
