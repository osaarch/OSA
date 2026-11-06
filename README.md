# OSA — architectural portfolio

A scroll-driven 3D journey around **your Malwiya Minaret model** (`public/assets/malwiya/model.dae`,
loaded byte-for-byte as supplied) that darkens from sandstone beige to pure black and resolves into
an **OSA / WORKS** interface.

React · Three.js · React Three Fiber · Vite.

## Run

```bash
npm install
npm run dev        # development server
npm run build      # production site in dist/  (upload dist/ to any static host)
npm run build:single   # optional: ONE self-contained index.html in dist-single/
```

## Put your own content in (no code changes needed)

1. **Text** — open `src/content.js`. Every text exists twice, `en` and `ar` (the site opens in English;
   the visitor switches with the **EN / AR** button, or `?lang=ar`). Edit `profile` (name, headline,
   biography, philosophy, areas, contact) and the projects (title, location, type, description, concept,
   form generation, captions…). Interface words (menu, HUD, buttons) are in `src/i18n.js`. The Arabic is a
   faithful translation made from the English text — have it read once by you before you rely on it.
2. **Portrait** — save as `src/assets/profile/portrait.jpg` (4:5). On the OSA page it sits on a sandstone
   panel (white background of the photo turns into the panel colour).
3. **Project photographs** — one folder per project in `src/assets/projects/<slug>/`:
   * `cover.jpg` is the hero image and the WORKS stage image (or name the file in `coverFile`)
   * `01.jpg`, `02.jpg`, … become the editorial sequence on that project's page
   * the folder name must equal the project's `slug` in `src/content.js`
   * **`logo.svg`** (or `.png` / `.webp`) is the project's **logo** — it has its own place on the WORKS
     stage, at the end of the 3D journey and at the top of the project page
4. **Captions** are looked up by the number a file starts with: `captions: { '03': { title, text } }`
   applies to `03-anything.jpg`. Slots without an image yet (Al Rafidain Stadium: `01` and `03`) are simply
   not shown — drop `01-….jpg` / `03-….jpg` into the folder and they appear with their captions.
5. To add a project, add an entry to `projectData` and create its folder. A project page can carry:
   `subtitle`, `tagline`, `credit`, `description` (overview paragraphs), `concept { title, text[] }`,
   `stages { title, items[{ title, text }] }`, `sections [{ title, text[] }]` (e.g. *Shared Public Ground*,
   *Envelope and Materials*) and `programme []` — each block appears as soon as it has content.
   **Project 2 — The Promethean Port** lives in `src/assets/projects/promethean-port/` (`logo.png` is the
   original logo, unchanged). Its long paragraphs go into `description`, `concept.text`, the `stages` items'
   `text` and `sections` in `src/content.js`.

Until real photographs exist, honest empty frames are shown. Nothing is faked.

## Typography — Century Gothic

OSA / WORKS are set in **Century Gothic**. It is a licensed Monotype font, so it cannot be shipped
inside this project. The site uses it automatically wherever it is installed (Windows; macOS with
Microsoft Office). On other devices it falls back to **Jost**, a close geometric match, which is
bundled. To guarantee Century Gothic everywhere, license a web-font version and add it to
`src/styles.css`:

```css
@font-face {
  font-family: 'Century Gothic Local';
  src: url('/fonts/CenturyGothic.woff2') format('woff2');
  font-weight: 400;
}
```

## How the journey works

| File | Role |
| --- | --- |
| `src/scene/Malwiya.jsx` | Loads `model.dae`; keeps every original face and UV, swaps the two stone textures for earth brick / plaster |
| `src/scene/earth.js` | The material: seamless baked-mud-brick and earth-plaster textures (+ bump maps) in `src/assets/malwiya/`, and the shared dusk shader |
| `src/scene/Enclosure.js` | The wall of the Great Mosque of Samarra around the tower, at its real size (see below) |
| `src/scene/path.js` | The camera path: approach + 360° orbit, a pure function of scroll |
| `src/scene/grade.js` | The colour script: beige → ember → black (sky, fog, sun, shadows) |
| `src/journey.js` | Scroll progress + critically-damped spring (smooth, fully reversible) |
| `src/scene/Scene.jsx` | The render loop (camera, lights, HUD variables, adaptive resolution) |

Tuning: edit the keyframe arrays at the top of `path.js` (distance `R`, height `H`, look-at `TY`,
field of view `FOV`) and the length of the scroll in `SPACER_VH` (`src/journey.js`).

### Notes on the model

* SketchUp exported its **edge outlines** as separate line objects. They are not architecture, so
  they are not drawn. Every face is untouched.
* The model's group has a **mirrored transform**; the render path bakes it into the vertices so the
  geometry is shown exactly as authored (same shape, same proportions, correct face orientation).
* No geometry is scaled, simplified or replaced. 14,658 triangles, original scale (≈ 41 × 48.5 × 43 m).
* **Material:** the real Malwiya is baked mud brick, so the model's yellow rubble-stone and khaki textures are replaced
  by an earth-brown brick (running bond, sand-filled joints, erosion pits, weathering streaks) and an earth plaster for
  the ramp and the plinth tops. They were generated procedurally (tileable 1024 px colour + 512 px bump); the model's own
  UVs (≈ 3 m per tile) are unchanged. To tune the colour or the wear, edit the palette in the generator
  (`tools/gen_earth.py` — kept in the repo) and run it again.
* **The wall (`Enclosure.js`):** the tower stands inside the outer enclosure (ziyada) of al-Mutawakkil's Great Mosque,
  a baked-brick wall 376 × 444 m, ≈ 10 m high and 2.65 m thick, with 44 semicircular towers (4 at the corners + 10 per side)
  and twelve gateways (the middle one of the north wall is on the tower's axis). It is built at that real size, 75 m north
  of the tower, with a few bays that have lost their tops, in the same brick; it takes the same dusk shading as the tower.

## Project 1 — Al Rafidain Stadium (its own 3D journey)

Opening the project plays a scroll-driven journey built from the project's own Rhino file, in the colours of
its renders: a golden, dusty day → dusk → a black night with the stadium glowing red from within → the camera
climbs until it looks straight down into the bowl (the spectators appear) → everything goes black → the logo
is revealed → the project page begins. Scroll back up and it plays in reverse.

| File | Role |
| --- | --- |
| `public/assets/stadium/stadium.glb` | The stadium, made from `STADUAM.3dm` (roof planes, bowl, glazing, lettering, site, water, planting) |
| `src/scene/stadium/StadiumScene.jsx` | Loads the model, lights it, owns the render loop (loaded only on this page) |
| `src/scene/stadium/materials.js` | The clay / rammed-earth look, generated in the shader (no textures) + the red night glow; the lit amber glazing, the muted pitch (105 × 68 m, aligned with the bowl) and the spectators in the seat rows |
| `src/scene/stadium/path.js` · `grade.js` | The camera path (pure function of scroll) and the colour script |
| `src/scene/stadium/Foliage.jsx` | Palms and trees scattered over the model's planted ground |
| `src/scene/stadium/state.js` | Scroll length of the journey (`SJ_VH`) and the four chapter captions |

`scene: 'stadium'` in `src/content.js` switches a project to this journey; without it a project uses the
classic photographic hero. If WebGL or the model is unavailable the page falls back to the classic hero.
Each place has its own music. The Malwiya plays an **epic, ancient-sounding score** (`MOODS.odyssey`, `grooveOdyssey()`):
an original piece in the spirit of a mythic sea-voyage film — no orchestra, no copy of any existing score — in maqam
**Bayati** on D over a deep D–A drone: a plucked lyre, a double-reed aulos, bronze bells, wood blocks and a big frame drum
beating like oars (one stroke per beat, 72 bpm). It follows the scroll: a deep bronze and one lyre call while the dust
clears; the oar-stroke pulse and the lyre's 3+3+4+3+3 cell wake as the visitor starts to scroll; bronze, wood, a rolling
frame drum and a swelling pad and drone around the dusk; then the percussion withdraws and the score resolves on the black
screen (a last bronze, one long breath on D, the lyre alone). The mapping from scroll to `pulse` / `drive` / `end` is in
`Scene.jsx`. The first home piece (free-rhythm Bayati: oud phrases, a ney, a drone) is still there: open the site with
`?music=classic`.
The stadium plays a **modern desert piece** (`MOODS.desert`, `grooveDesert()`): maqam **Hijaz** on F in a rolling 6/8, a
frame-drum / hand-clap groove, a sub-bass pedal, a plucked cross-rhythm (4 notes against the 2 beats) echoing like a
call across dunes, a bowed rababa-like lead and wide pads, with a composed arc: intro → groove that grows with the
scroll → a hook / call / long breath / answer every 8 bars → on the black logo screen the drums step back and the
music resolves on a long note. The first version — a club-style Rast groove at 104 bpm — is still there: open the
site with `?music=club`. Its description follows.
The club version is a **modern Arabic piece** that shares nothing with it but the engine: maqam **Rast** on C
at 104 bpm — a soft kick pumping a sub-bass and an airy pad (side-chain), a darbuka playing the *maqsum*
(teks and soft ghost notes), hand-claps, a shaker, a qanun-like plucked arpeggio in 3+3+2 over the chords
C – A – F – G, and a reedy lead that scoops into each note and ends its phrases on a chord tone, with one
long breathy note in the calm bars and a riser / impact / tom roll at the turn of every eight-bar phrase.
It is calm *and* driving from the first bar (kick, darbuka and shaker are already there at the start), and
grows as the camera climbs: claps, bass syncopation, fills, then brass fanfares and a roaring, chanting crowd,
with a referee's whistle when the full stands appear. The wind and falling-sand texture stays underneath, and
only the music remains once the screen goes black (`MOODS.stadium`, `grooveModern()` and the voices after
`kick()` in `src/audio.js`; the mapping to scroll is in `StadiumScene.jsx`).
**The home music never leaks into a project:** every mood has its own gates (`makeEpoch`), and `setMood()`
closes the old mood's gates while opening the new one, so the stadium plays only its own score and every
other project plays a quiet harbour piece (`MOODS.port`: maqam Hijaz, a sea breeze underneath). Back on the
home page / OSA / WORKS the Malwiya score returns.
The stadium glass is black in the day; at night it lights up sky-blue (`GLASS_LIT` in
`src/scene/stadium/materials.js` — red was tried and melts into the red walls).

**Project film:** a project can have one film in its "Form generation" section — drop the file in `public/media/`
and name it in `content.js` (`video:` / `videoPoster:`). The stadium's is `public/media/rafidain-form-generation.mp4`
(plays silently, looping, while it is on screen; the controls are there). The single-file build leaves films out.
**Text:** paragraphs are justified (both edges even; hyphenation only in narrow columns) and every block of the
project page starts on the same left edge (right edge in Arabic) — see the last rule of `src/styles.css`.

## Behaviour worth knowing

* Scroll down to fly in; scroll up to fly back out — the same path, reversed.
* *Skip journey* / *Fly back* animate the scroll. Any wheel, touch or key press takes control back.
* Routes are hash-based (`#osa`, `#works`, `#works-<slug>`): works on any static host, and the
  browser back button works. `Esc` goes up one level.
* **Teaser:** the visitor first chooses "Enter with sound / without", then a sandstorm clears to reveal the
  Malwiya (the cursor wipes the dust). The teaser copy is `intro` in `src/content.js`. Any click, key or scroll
  fast-forwards it.
* **Mouse:** the monument tilts and shifts with the cursor, and the sand grains are pushed and swirled by it.
* **Language:** English by default; the **EN / AR** switch sits next to the sound button (also on the "Enter"
  screen). Arabic switches the text to right-to-left with the Cairo typeface; the OSA / WORKS wordmark stays
  Latin. The choice is remembered.
* **Music:** generated live in the browser (no audio files) — on the home journey an original, ancient-epic maqam-Bayati
  score (lyre, aulos, bronze, frame drum, drone; `?music=classic` for the earlier oud-and-ney piece) with wind and
  falling-sand texture. The wind/sand fades away at OSA / WORKS and only the music
  stays. The "Sound on/off" button is always in the top-right corner; the choice is remembered. Tune the mood in
  `src/audio.js` (scale `CENTS`, `CHORDS`, phrase rhythm in `phrase()`).
* **Night mode:** the small moon next to the sound button (also on the "Enter" screen) turns the Malwiya and
  the stadium into a moonlit, rainy night — a dark blue sky with a moon, rain on the screen (`src/ui/Rain.jsx`)
  and rain in the soundtrack (`rain` layer in `src/audio.js`). The choice is remembered. The colours are
  `nightBlend()` in `src/scene/grade.js` (Malwiya) and `src/scene/stadium/grade.js` (stadium: the bowl glows
  red, the glazing lights sky-blue); the switch itself is `src/night.js`.
  **The rain only belongs to the entry journeys:** it falls (and sounds) while the Malwiya / stadium journey is on
  screen, fades out when the screen goes black, and never appears on OSA, WORKS or the project pages
  (`setRainZone()` in `src/night.js`, called by both journeys' frame loops and reset on every page change).
* Visitors who land directly on a project page never download the 3D engine.
* If WebGL is unavailable the interface still works (black background, OSA / WORKS, all pages).
* Resolution adapts automatically on slower GPUs; the renderer idles completely on the black screen.
* Append `?debug` to the URL to expose `window.__three` for inspection.


## Publishing on GitHub Pages (public website)

1. Create a **new, empty repository** on GitHub (for example `osa`). Do not reuse a repository that already
   holds another website.
2. Upload this project's files to it (everything except `node_modules/` and `dist/`) on the `main` branch.
3. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push. The public
   address appears in the workflow run and in Settings → Pages
   (`https://<username>.github.io/<repository>/`; name the repository `<username>.github.io` for the shorter
   `https://<username>.github.io/`).

To use your own domain later, add it under Settings → Pages → Custom domain.

Contact details shown on the OSA page are in `src/content.js` (`profile.contact`).
