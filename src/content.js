// ═════════════════════════════════════════════════════════════════════════════
//  ALL OF THE SITE'S PERSONAL CONTENT LIVES IN THIS FILE — in English and in Arabic.
//
//  Every text exists twice: under `en` and under `ar`. The AR / EN switch on the site
//  chooses which one is shown (English is the default). Images, links and the 3D scene
//  are shared by both languages.
//  Photographs go in the folders described in README.md; nothing else needs to change.
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
  // cover.jpg is the hero image; otherwise the one named in `coverFile`; otherwise the first file.
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
const introText = {
  en: { arabic: 'الملوية', title: 'AL-MALWIYA', line: 'Beyond the dust, a spiral rises.' },
  ar: { arabic: 'الملوية', title: 'AL-MALWIYA', line: 'خلف الغبار، تنهض حلزونة.' },
}

// ── PROFILE  (the OSA page) ──────────────────────────────────────────────────
const profileShared = {
  portrait: profileImage(), // src/assets/profile/portrait.jpg
  portraitCaption: '',
  email: 'osama.architects@gmail.com',
  instagram: 'osa.arch',
  phone: '+964 774 999 8299',
}

const profileText = {
  en: {
    name: 'OSAMA',
    title: 'OSA — Architecture / Design / Visualization',
    headline: 'Architecture, rooted in place.',
    // the short introduction beside the portrait
    identity:
      'I am Osama, an Iraqi architect from Samarra. My work explores form, light and material, with an interest in spaces that connect people to their surroundings.',
    biography: [
      'I am an Iraqi architect from Samarra, a city whose architectural heritage has shaped the way I understand space and place. Growing up alongside landmarks such as Al-Malwiya has deepened my appreciation of architecture’s relationship with cultural identity and everyday life.',
      'My work spans architectural design, public spaces, residential façades and architectural visualization. Across these different scales, I explore how geometry, materials and natural light shape the experience of a building—from its presence in the landscape to the spaces people move through and share.',
    ],
    philosophy: {
      statement: '“I want to create an environment where everyone feels welcome.”',
      paragraphs: [
        'I approach design through the relationship between people and place. I am interested in translating local identity into contemporary architecture, allowing the character of a setting to inform its spaces, materials and architectural language.',
        'I pay attention to how people arrive, move, pause and gather. These everyday experiences guide my ambition to create architecture that feels welcoming and connected to its surroundings.',
      ],
    },
    areas: ['Architectural Design', 'Façade Design', '3D Modeling', 'Architectural Visualization'],
    worksIntro:
      'Selected architectural projects exploring form, landscape and public life. Each project presents a different approach to context, spatial experience and material expression.',
    contactIntro: 'For project inquiries and collaborations, get in touch.',
    contactLabels: { email: 'Email', instagram: 'Instagram', phone: 'Phone' },
  },
  ar: {
    name: 'أسامة',
    title: 'OSA — عمارة / تصميم / تصوير معماري',
    headline: 'عمارة متجذّرة في المكان.',
    identity:
      'أنا أسامة، مهندس معماري عراقي من سامراء. يستكشف عملي الشكل والضوء والمادة، باهتمام بالفضاءات التي تربط الناس بمحيطهم.',
    biography: [
      'أنا مهندس معماري عراقي من سامراء، المدينة التي شكّل إرثها المعماري طريقة فهمي للفضاء والمكان. وقد عمّق نشأتي إلى جوار معالم مثل الملوية تقديري لعلاقة العمارة بالهوية الثقافية والحياة اليومية.',
      'يشمل عملي التصميم المعماري والفضاءات العامة وواجهات المباني السكنية والتصوير المعماري. وعبر هذه المقاييس المختلفة أستكشف كيف تصوغ الهندسة والمواد والضوء الطبيعي تجربة المبنى، من حضوره في المشهد الطبيعي إلى الفضاءات التي يتحرك فيها الناس ويتشاركونها.',
    ],
    philosophy: {
      statement: '«أريد أن أصنع بيئة يشعر فيها الجميع بأنهم موضع ترحيب.»',
      paragraphs: [
        'أقارب التصميم من خلال العلاقة بين الناس والمكان. يهمّني أن أترجم الهوية المحلية إلى عمارة معاصرة، تاركًا طابع الموقع يُلهم فضاءاته ومواده ولغته المعمارية.',
        'أنتبه إلى كيفية وصول الناس وتنقّلهم وتوقّفهم واجتماعهم. وتقود هذه التجارب اليومية طموحي إلى صنع عمارة تبعث على الترحيب وتتصل بمحيطها.',
      ],
    },
    areas: ['التصميم المعماري', 'تصميم الواجهات', 'النمذجة ثلاثية الأبعاد', 'التصوير المعماري'],
    worksIntro:
      'مشاريع معمارية مختارة تستكشف الشكل والمشهد الطبيعي والحياة العامة. يقدّم كل مشروع مقاربة مختلفة للسياق والتجربة المكانية والتعبير المادي.',
    contactIntro: 'للاستفسار عن المشاريع وفرص التعاون، يسعدني تواصلكم.',
    contactLabels: { email: 'البريد الإلكتروني', instagram: 'إنستغرام', phone: 'الهاتف' },
  },
}

function buildProfile(lang) {
  const t = profileText[lang]
  const s = profileShared
  return {
    ...s,
    ...t,
    contact: [
      { label: t.contactLabels.email, value: s.email, href: `mailto:${s.email}` },
      { label: t.contactLabels.instagram, value: `@${s.instagram}`, href: `https://instagram.com/${s.instagram}` },
      { label: t.contactLabels.phone, value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}`, ltr: true },
    ],
  }
}

// ── PROJECTS  (the WORKS page and one detail page per project) ───────────────
// `slug` must match the folder name in src/assets/projects/<slug>/
// `scene: 'stadium'` gives a project its own scroll-driven 3D journey.
const projectData = [
  {
    // ── PROJECT ONE · Al Rafidain Stadium ────────────────────────────────────
    // The journey's model is public/assets/stadium/stadium.glb (made from the Rhino file).
    // The logo is src/assets/projects/al-rafidain-stadium/logo.svg.
    slug: 'al-rafidain-stadium',
    scene: 'stadium',
    // the cover (WORKS page) and the images of the project, by the number they start with
    // in src/assets/projects/al-rafidain-stadium/   (01-…, 02-…, 03-…, 04-…)
    coverFile: '04-river-and-architecture.jpg',
    // the form-generation film: public/media/ (kept out of the bundle, so the big single-file build skips it)
    video: 'media/rafidain-form-generation.mp4',
    videoPoster: 'media/rafidain-form-generation-poster.jpg',
    en: {
      title: 'Al Rafidain Stadium',
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
      captions: {
        '01': { title: 'A Landscape of Fragments', text: 'The main stadium, secondary stadium and supporting volumes form a connected composition across the site.' },
        '02': { title: 'Emerging from the Ground', text: "Tilted planes translate the concept of uplifted terrain into the stadium's architectural profile." },
        '03': { title: 'Inside the Bowl', text: 'The seating bowl gathers spectators around the pitch beneath the articulated roof.' },
        '04': { title: 'River and Architecture', text: 'Water and planted ground connect the stadium with its surrounding landscape.' },
      },
    },
    ar: {
      title: 'ملعب الرافدين',
      location: 'تكريت، العراق',
      type: 'العمارة الرياضية والمشهد الطبيعي',
      format: 'دراسة تصميمية',
      summary: 'دراسة تصميمية لملعب ومشهد طبيعي، شكّلها أثر النهر وصورة الأرض المتشقّقة وهي ترتفع لتصير عمارة.',
      description: [
        'يستكشف ملعب الرافدين العلاقة بين النهر والأرض والعمارة. وانطلاقًا من مستوطنات ضفاف الأنهار في بلاد الرافدين كنقطة بداية مفاهيمية، يترجم المقترح أثر النهر الرمزي إلى شبكة من الشقوق عبر الأرض. تنهض هذه الشظايا وتميل، لتكشف عن الملعب والكتل المعمارية المحيطة به.',
        'يجمع المخطط العام بين ملعب رئيسي وملعب ثانوي ومبانٍ مساندة ضمن تكوين من الأشكال الزاويّة. وتنقل الحواف المضلّعة وأسطح السقف المائلة فكرة الأرض المرتفعة إلى الشكل المعماري، بينما يربط الماء والمساحات المزروعة المباني بمحيطها الطبيعي.',
        'ويقدّم التكوين الناتج العمارة بوصفها انبثاقًا من الأرض. وتتشكّل هوية الملعب من العلاقة بين السطح المتشقّق والشظايا المرتفعة والفراغات التي تنكشف بينها.',
      ],
      concept: {
        title: 'من النهر إلى العمارة',
        text: [
          'يبدأ المفهوم من النهر بوصفه خطّ اتصال يعبر المشهد الطبيعي. ويمتد أثره الرمزي إلى الموقع، محوّلًا الأرض إلى سلسلة من الشظايا غير المنتظمة.',
          'ومع ارتفاع هذه الشظايا تصبح كتلًا معمارية. وتُرسي ارتفاعاتها وميولها المتفاوتة صورة الملعب وتنظّم الفضاءات المحيطة به. ويعبّر التكوين النهائي عن النهر والأرض والشكل المبني بوصفها أجزاءً من مشهد واحد متصل.',
        ],
      },
      formGeneration: [
        { title: 'ضفة النهر', text: 'يشكّل النهر والأرض الطينية نقطة الانطلاق المفاهيمية.' },
        { title: 'أثر النهر', text: 'يمتد أثر رمزي إلى الموقع ويبدأ تحويل الأرض.' },
        { title: 'تشقّق الأرض', text: 'ينفصل السطح إلى شظايا غير منتظمة حول الملعب الناشئ.' },
        { title: 'ارتفاع الشظايا', text: 'ترتفع الشظايا وتميل، فتترجم الأرض المتشقّقة إلى كتل معمارية.' },
        { title: 'انبثاق الملعب', text: 'ينكشف الملعب بين الشظايا المرتفعة.' },
        { title: 'استمرارية المشهد', text: 'يشكّل الملعب والكتل المحيطة به امتدادًا للأرض.' },
      ],
      material: {
        title: 'التعبير المادي',
        text: 'تحدّد أسطحُ السقف المضلّعة والزجاج الداكن والأرض المزروعة التعبير البصري للمشروع. ويخلق الزجاج بلونه البنّي الداكن جدًّا، المقارب للأسود، أسطحًا غائرة تحت الأشكال الزاويّة للسقف.',
      },
      captions: {
        '01': { title: 'مشهد من الشظايا', text: 'يشكّل الملعب الرئيسي والملعب الثانوي والكتل المساندة تكوينًا متصلًا عبر الموقع.' },
        '02': { title: 'ينبثق من الأرض', text: 'تترجم المستويات المائلة فكرة الأرض المرتفعة إلى الشكل المعماري للملعب.' },
        '03': { title: 'داخل المدرّج', text: 'يجمع مدرّج الجلوس المتفرجين حول الملعب تحت السقف المفصّل.' },
        '04': { title: 'النهر والعمارة', text: 'يربط الماء والأرض المزروعة الملعب بمحيطه الطبيعي.' },
      },
    },
  },
  {
    // ── PROJECT TWO · Four Gates Cultural Complex ───────────────────────────
    // Images: src/assets/projects/four-gates/  (03-… is the cover; captions by number).
    // The programme diagram and the three composition diagrams are drawn in code
    // (src/ui/GateDiagrams.jsx); their labels are in `programmeDiagram` and `composition` below.
    slug: 'four-gates',
    coverFile: '03-framing-the-landmark.jpg',
    coverInGallery: true, // the cover is also one of the five architectural views (it carries a caption)
    en: {
      title: 'Four Gates Cultural Complex',
      year: '2026',
      location: 'Iraq',
      type: 'Islamic Cultural Complex / Mixed Use',
      summary:
        "Four shrine gates become four open plazas, each opening a clear route into a distinct part of an Islamic cultural complex.",
      concept: {
        title: 'Four gates. Four plazas.',
        text: [
          "The concept begins with the shrine's four gates. Each becomes an open plaza, creating four points of arrival and a clear route into a distinct part of the complex.",
          'The plazas connect hotel and medical support, entertainment and dining, education, and cultural activities. Arcaded routes and landscaped courts bring these branches into a connected public realm.',
        ],
      },
      programmeDiagram: {
        title: 'Four gates programme diagram',
        desc: 'A central shrine connects through four open plazas to hotel and medical support above, entertainment and dining on the left, education below, and culture on the right. The diagram is conceptual and not to scale.',
        caption: 'Conceptual programme / Not to scale',
        labels: {
          hotel: ['HOTEL +', 'MEDICAL'],
          entertainment: ['ENTERTAINMENT'],
          shrine: ['SHRINE'],
          culture: ['CULTURE'],
          education: ['EDUCATION'],
        },
      },
      programme: [
        { title: 'Hotel + Medical Support', text: 'Visitor accommodation and associated medical services.' },
        { title: 'Entertainment + Dining', text: 'Leisure spaces and restaurant activity.' },
        { title: 'Education', text: 'Spaces for learning and educational activity.' },
        { title: 'Culture', text: 'Spaces for cultural activities.' },
      ],
      composition: {
        label: 'Composition',
        title: 'Form & facade.',
        text: 'Four shrine gates become open plazas, then organise programme branches connected by shaded pedestrian routes.',
        steps: [
          {
            title: 'Read the four gates',
            text: "The shrine's four gates establish four points of departure.",
            tag: 'Arrival / Gateways',
            alt: 'A central shrine with four openings',
          },
          {
            title: 'Open four plazas',
            text: 'Each gate is expressed as an open space for arrival and gathering.',
            tag: 'Shaded arcades',
            alt: 'The four gates open onto four plazas',
          },
          {
            title: 'Connect the programme',
            text: 'The plazas lead to four functions, linked by routes and landscaped courts.',
            tag: 'Landscape / Water',
            alt: 'Four programme branches linked around a connected public realm',
          },
        ],
      },
      captions: {
        '01': { title: 'Open Ground', text: 'Freestanding gate forms mark landscaped courts, giving the open spaces a clear rhythm of arrival and gathering.' },
        '02': { title: 'The Shared Courtyard', text: 'A pavilion of pointed arches anchors the courtyard, framed by arcades, palm planting and shaded edges.' },
        '03': { title: 'Framing the Landmark', text: 'Repeated pointed arches frame the route towards the faceted landmark, connecting architectural rhythm with movement through the complex.' },
        '04': { title: 'Shaded Connections', text: 'Palm planting and repeated arches create a shaded sequence between building edges and shared outdoor spaces.' },
        '05': { title: 'Water and Pause', text: 'A linear water channel, planted pergolas and seating introduce places to rest along the pedestrian route.' },
      },
    },
    ar: {
      title: 'مجمع البوابات الأربع الثقافي',
      year: '2026',
      location: 'العراق',
      type: 'مجمع ثقافي إسلامي / متعدد الاستعمالات',
      summary: 'تتحوّل بوابات المرقد الأربع إلى أربع ساحات مفتوحة، تفتح كل منها طريقًا واضحًا إلى جزء مختلف من المجمّع الثقافي الإسلامي.',
      concept: {
        title: 'أربع بوابات. أربع ساحات.',
        text: [
          'يبدأ المفهوم من البوابات الأربع للمرقد. تتحوّل كل بوابة إلى ساحة مفتوحة، فتصنع أربع نقاط وصول وطريقًا واضحًا إلى جزء متميّز من المجمّع.',
          'تربط الساحات بين الفندق والدعم الطبي، والترفيه والمطاعم، والتعليم، والأنشطة الثقافية. وتجمع الممرات المقوّسة والباحات المشجّرة هذه الفروع في فضاء عام متصل.',
        ],
      },
      programmeDiagram: {
        title: 'مخطط برنامج البوابات الأربع',
        desc: 'مرقد في الوسط يتصل عبر أربع ساحات مفتوحة بالفندق والدعم الطبي في الأعلى، والترفيه والمطاعم على اليسار، والتعليم في الأسفل، والثقافة على اليمين. المخطط تصوّري وغير مرسوم بمقياس.',
        caption: 'برنامج تصوّري / غير مرسوم بمقياس',
        labels: {
          hotel: ['الفندق', 'والدعم الطبي'],
          entertainment: ['الترفيه', 'والمطاعم'],
          shrine: ['المرقد'],
          culture: ['الثقافة'],
          education: ['التعليم'],
        },
      },
      programme: [
        { title: 'الفندق + الدعم الطبي', text: 'إقامة الزوّار والخدمات الطبية المرتبطة بها.' },
        { title: 'الترفيه + المطاعم', text: 'فضاءات الترفيه والنشاط المطعمي.' },
        { title: 'التعليم', text: 'فضاءات التعلّم والنشاط التعليمي.' },
        { title: 'الثقافة', text: 'فضاءات للأنشطة الثقافية.' },
      ],
      composition: {
        label: 'التكوين',
        title: 'الشكل والواجهة.',
        text: 'تتحوّل بوابات المرقد الأربع إلى ساحات مفتوحة، ثم تنظّم فروع البرنامج التي تربطها ممرات مشاة مظلّلة.',
        steps: [
          {
            title: 'قراءة البوابات الأربع',
            text: 'تُرسي بوابات المرقد الأربع أربع نقاط انطلاق.',
            tag: 'الوصول / المداخل',
            alt: 'مرقد في الوسط بأربع فتحات',
          },
          {
            title: 'فتح أربع ساحات',
            text: 'يُعبَّر عن كل بوابة بفضاء مفتوح للوصول والتجمّع.',
            tag: 'أروقة مظلّلة',
            alt: 'تنفتح البوابات الأربع على أربع ساحات',
          },
          {
            title: 'ربط البرنامج',
            text: 'تقود الساحات إلى أربع وظائف، تربطها ممرات وباحات مشجّرة.',
            tag: 'المشهد الطبيعي / الماء',
            alt: 'أربعة فروع للبرنامج مرتبطة حول فضاء عام متصل',
          },
        ],
      },
      captions: {
        '01': { title: 'أرض مفتوحة', text: 'تحدّد أشكال بوابات قائمة بذاتها باحات مشجّرة، فتمنح الفضاءات المفتوحة إيقاعًا واضحًا للوصول والتجمّع.' },
        '02': { title: 'الباحة المشتركة', text: 'يرسو في الباحة جناح من العقود المدبّبة، تحيط به الأروقة وأشجار النخيل والأطراف المظلّلة.' },
        '03': { title: 'تأطير المَعلم', text: 'تؤطّر العقود المدبّبة المتكرّرة الطريق نحو المَعلم المضلّع، رابطةً الإيقاع المعماري بحركة التنقّل في المجمّع.' },
        '04': { title: 'وصلات مظلّلة', text: 'يصنع غرس النخيل والعقود المتكرّرة تتابعًا مظلّلًا بين حواف المباني والفضاءات الخارجية المشتركة.' },
        '05': { title: 'الماء والتوقّف', text: 'تقدّم قناة مائية خطية وبرغولات مزروعة ومقاعد أماكنَ للاستراحة على طول مسار المشاة.' },
      },
    },
  },
  {
    // ── PROJECT THREE · The Promethean Port ───────────────────────────────────
    // Images + logo: src/assets/projects/promethean-port/  (01-… is the cover; captions by number)
    // The long paragraphs (overview, concept, shared ground, envelope) go into `description`,
    // `concept.text`, `stages` items and `sections` below — each section appears as soon as it has text.
    slug: 'promethean-port',
    coverFile: '01-the-promethean-port.jpg',
    en: {
      title: 'The Promethean Port',
      subtitle: 'Tesla Headquarters — Port Said',
      tagline: 'Where Abundance Takes Root',
      location: 'Port Said, Egypt',
      type: 'Headquarters, Production, Learning and Public Space',
      format: 'Design Proposal',
      credit: 'Collaborative Project — SAE Group 23',
      summary:
        'A proposed Tesla headquarters connecting technological work, practical learning and everyday public life through shared spaces rooted in Port Said.',
      stages: {
        title: 'Three Stages',
        items: [{ title: 'Transit' }, { title: 'Severance' }, { title: 'Landing' }],
      },
      programme: ['Headquarters', 'Vehicle Production', 'Robotics Production', 'Exhibitions', 'Learning Centre', 'Public Ground'],
      captions: {
        '02': 'Shared Ground',
        '04': 'Folded Shading',
        '05': 'Water and Gathering',
        '06': 'Learning and Making',
        '07': 'Everyday Exchange',
        '10': 'Public Life After Dark',
      },
    },
    ar: {
      title: 'الميناء البروميثي',
      subtitle: 'مقترح مقر تسلا في بورسعيد',
      tagline: 'حيث تتجذّر الوفرة',
      location: 'بورسعيد، مصر',
      type: 'مقر رئيسي، إنتاج، تعلّم وفضاء عام',
      format: 'مقترح تصميمي',
      credit: 'مشروع تعاوني — SAE Group 23',
      summary:
        'مقر مقترح لتسلا يربط العمل التقني والتعلّم العملي والحياة العامة اليومية عبر فضاءات مشتركة متجذّرة في بورسعيد.',
      stages: {
        title: 'ثلاث مراحل',
        items: [{ title: 'العبور' }, { title: 'الانفصال' }, { title: 'الهبوط' }],
      },
      programme: ['المقر الرئيسي', 'إنتاج المركبات', 'إنتاج الروبوتات', 'المعارض', 'مركز التعلّم', 'الأرضية العامة'],
      captions: {
        '02': 'الأرضية المشتركة',
        '04': 'التظليل المطوي',
        '05': 'الماء والتجمّع',
        '06': 'التعلّم والصناعة',
        '07': 'التبادل اليومي',
        '10': 'الحياة العامة بعد الغروب',
      },
    },
  },
]

function buildProjects(lang) {
  return projectData.map((p, i) => {
    const text = p[lang]
    const is3d = Boolean(p.scene)
    const imgs = projectImages(p.slug, text.captions, { coverFile: p.coverFile, keepCoverInGallery: is3d || Boolean(p.coverInGallery) })
    return {
      slug: p.slug,
      scene: p.scene,
      placeholder: p.placeholder,
      ...text,
      index: i,
      number: String(i + 1).padStart(2, '0'),
      cover: imgs.cover,
      logo: imgs.logo,
      video: p.video && !__SINGLE__ ? import.meta.env.BASE_URL + p.video : null,
      videoPoster: p.videoPoster && !__SINGLE__ ? import.meta.env.BASE_URL + p.videoPoster : null,
      gallery: imgs.gallery,
      hasImages: imgs.count > 0,
    }
  })
}

const CONTENT = {}
for (const lang of ['en', 'ar']) {
  const projects = buildProjects(lang)
  CONTENT[lang] = {
    lang,
    intro: introText[lang],
    profile: buildProfile(lang),
    projects,
    findProject: (slug) => projects.find((p) => p.slug === slug),
  }
}

// The content for a language ('en' is the fallback).
export const getContent = (lang) => CONTENT[lang] || CONTENT.en

// Language-independent lookups (the scene a project uses, …) — English record.
export const projects = CONTENT.en.projects
export const findProject = CONTENT.en.findProject
