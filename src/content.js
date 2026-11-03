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
// The project's logo: src/assets/projects/<slug>/logo.svg  (or .png / .webp)
const logoFiles = import.meta.glob('./assets/projects/*/logo.{svg,png,webp,jpg}', {
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

// Captions are looked up by file name, then by the number the file starts with
// ('03-anything.jpg' -> captions['03']), so a new render only has to be dropped in.
const captionFor = (captions, file) => captions[file] ?? captions[(file.match(/^\d+/) || [''])[0]] ?? ''

function projectImages(slug, captions = {}, { coverFile: wantedCover, keepCoverInGallery = false } = {}) {
  const all = Object.entries(projectFiles)
    .filter(([p]) => p.includes(`/projects/${slug}/`))
    .map(([p, url]) => ({ file: p.split('/').pop(), url }))
    .filter((f) => !/^logo\./i.test(f.file))
    .sort(byName)
  // cover.jpg is the hero image; otherwise the one named in content.js; otherwise the first file.
  const coverFile =
    all.find((f) => /^cover\./i.test(f.file)) || all.find((f) => f.file === wantedCover) || all[0] || null
  const logo = Object.entries(logoFiles).find(([p]) => p.includes(`/projects/${slug}/`))
  return {
    cover: coverFile ? coverFile.url : null,
    logo: logo ? logo[1] : null,
    gallery: all
      .filter((f) => keepCoverInGallery || f !== coverFile)
      .map((f) => ({ src: f.url, caption: captionFor(captions, f.file) })),
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
    // ── PROJECT ONE · Al Rafidain Stadium ────────────────────────────────────
    // scene: 'stadium' opens the project with its own scroll-driven 3D journey (the model
    // is public/assets/stadium/stadium.glb, made from the Rhino file). The logo is
    // src/assets/projects/al-rafidain-stadium/logo.svg.
    slug: 'al-rafidain-stadium',
    scene: 'stadium',
    title: 'Al Rafidain Stadium',
    titleAr: 'ملعب الرافدين',
    location: 'Tikrit, Iraq',
    type: 'Sports Architecture and Landscape',
    format: 'Design Study',
    summary:
      "A stadium and landscape design study shaped by the river's trace and the image of fractured ground rising into architecture.",

    description: [
      "Al-Rafidain Stadium explores the relationship between river, terrain and architecture. Taking Mesopotamia's riverside settlements as its conceptual starting point, the proposal translates a symbolic river trace into a network of fractures across the ground. These fragments lift and tilt, revealing the stadium and its surrounding architectural volumes.",
      'The masterplan brings together a main stadium, a secondary stadium and supporting buildings within a composition of angular forms. Faceted edges and tilted roof planes carry the idea of uplifted terrain into the architectural profile, while water and planted spaces connect the buildings to their surrounding landscape.',
      "The resulting composition presents architecture as an emergence from the ground. The stadium's identity develops through the relationship between the fractured surface, the raised fragments and the spaces revealed between them.",
    ],

    concept: {
      title: 'From River to Architecture',
      text: [
        'The concept begins with the river as a line of connection across the landscape. Its symbolic trace extends into the site, transforming the ground into a series of irregular fragments.',
        "As these fragments rise, they become architectural volumes. Their varying heights and inclinations establish the stadium's silhouette and organise the surrounding spaces. The final composition expresses the river, terrain and built form as parts of one continuous landscape.",
      ],
    },

    formGeneration: [
      { title: 'River Edge', text: 'The river and the earthen landscape establish the conceptual starting point.' },
      { title: 'River Trace', text: 'A symbolic trace extends into the site and initiates the transformation of the ground.' },
      { title: 'Ground Fracture', text: 'The surface separates into irregular fragments around the emerging stadium.' },
      { title: 'Fragment Uplift', text: 'Fragments lift and tilt, translating the fractured ground into architectural volumes.' },
      { title: 'Stadium Emergence', text: 'The stadium is revealed between the raised fragments.' },
      { title: 'Landscape Continuity', text: 'The stadium and surrounding volumes form an extension of the terrain.' },
    ],

    material: {
      title: 'Material Expression',
      text: "Faceted roof planes, dark glazing and planted ground define the project's visual expression. Glazing in a very dark brown tone, approaching black, creates recessed surfaces beneath the angular roof forms.",
    },

    // the cover (WORKS page) and the images of the project, by the number they start with
    // in src/assets/projects/al-rafidain-stadium/   (01-…, 02-…, 03-…, 04-…)
    coverFile: '04-river-and-architecture.jpg',
    captions: {
      '01': { title: 'A Landscape of Fragments', text: 'The main stadium, secondary stadium and supporting volumes form a connected composition across the site.' },
      '02': { title: 'Emerging from the Ground', text: "Tilted planes translate the concept of uplifted terrain into the stadium's architectural profile." },
      '03': { title: 'Inside the Bowl', text: 'The seating bowl gathers spectators around the pitch beneath the articulated roof.' },
      '04': { title: 'River and Architecture', text: 'Water and planted ground connect the stadium with its surrounding landscape.' },
    },
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
  const is3d = Boolean(p.scene)
  const imgs = projectImages(p.slug, p.captions, { coverFile: p.coverFile, keepCoverInGallery: is3d })
  return {
    ...p,
    index: i,
    number: String(i + 1).padStart(2, '0'),
    cover: imgs.cover,
    logo: imgs.logo,
    gallery: imgs.gallery,
    hasImages: imgs.count > 0,
  }
})

export const findProject = (slug) => projects.find((p) => p.slug === slug)
