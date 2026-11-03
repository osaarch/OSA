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

1. **Text** — open `src/content.js`. Edit `profile` (name, title, biography, philosophy, details,
   contact) and `projectData` (title, year, location, type, description…). Delete the line
   `placeholder: true` when you are done.
2. **Portrait** — save as `src/assets/profile/portrait.jpg`.
3. **Project photographs** — one folder per project in `src/assets/projects/<slug>/`:
   * `cover.jpg` is the hero image and the WORKS stage image (or name the file in `coverFile`)
   * `01.jpg`, `02.jpg`, … become the editorial sequence on that project's page
   * the folder name must equal the project's `slug` in `src/content.js`
   * **`logo.svg`** (or `.png` / `.webp`) is the project's **logo** — it has its own place on the WORKS
     stage, at the end of the 3D journey and at the top of the project page
4. **Captions** are looked up by the number a file starts with: `captions: { '03': { title, text } }`
   applies to `03-anything.jpg`. Slots without an image yet (Al Rafidain Stadium: `01` and `03`) are simply
   not shown — drop `01-….jpg` / `03-….jpg` into the folder and they appear with their captions.
5. To add a project, add an entry to `projectData` and create its folder.

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
| `src/scene/Malwiya.jsx` | Loads `model.dae`; keeps every original face, colour and texture |
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

## Project 1 — Al Rafidain Stadium (its own 3D journey)

Opening the project plays a scroll-driven journey built from the project's own Rhino file, in the colours of
its renders: a golden, dusty day → dusk → a black night with the stadium glowing red from within → the camera
climbs until it looks straight down into the bowl (the spectators appear) → everything goes black → the logo
is revealed → the project page begins. Scroll back up and it plays in reverse.

| File | Role |
| --- | --- |
| `public/assets/stadium/stadium.glb` | The stadium, made from `STADUAM.3dm` (roof planes, bowl, glazing, lettering, site, water, planting) |
| `src/scene/stadium/StadiumScene.jsx` | Loads the model, lights it, owns the render loop (loaded only on this page) |
| `src/scene/stadium/materials.js` | The clay / rammed-earth look, generated in the shader (no textures) + the red night glow |
| `src/scene/stadium/path.js` · `grade.js` | The camera path (pure function of scroll) and the colour script |
| `src/scene/stadium/Foliage.jsx` | Palms and trees scattered over the model's planted ground |
| `src/scene/stadium/state.js` | Scroll length of the journey (`SJ_VH`) and the four chapter captions |

`scene: 'stadium'` in `src/content.js` switches a project to this journey; without it a project uses the
classic photographic hero. If WebGL or the model is unavailable the page falls back to the classic hero.
Each place has its own music: the Malwiya plays maqam Bayati; the stadium plays maqam **Rast** with a soft
low frame-drum that rises as the camera climbs over the bowl (`MOODS` in `src/audio.js`).

## Behaviour worth knowing

* Scroll down to fly in; scroll up to fly back out — the same path, reversed.
* *Skip journey* / *Fly back* animate the scroll. Any wheel, touch or key press takes control back.
* Routes are hash-based (`#osa`, `#works`, `#works-<slug>`): works on any static host, and the
  browser back button works. `Esc` goes up one level.
* **Teaser:** the visitor first chooses "Enter with sound / without", then a sandstorm clears to reveal the
  Malwiya (the cursor wipes the dust). The teaser copy is `intro` in `src/content.js`. Any click, key or scroll
  fast-forwards it.
* **Mouse:** the monument tilts and shifts with the cursor, and the sand grains are pushed and swirled by it.
* **Music:** generated live in the browser (no audio files) — a slow maqam-Bayati piece (oud-like plucks, ney-like
  flute, drone, pad) with wind and falling-sand texture. The wind/sand fades away at OSA / WORKS and only the music
  stays. The "Sound on/off" button is always in the top-right corner; the choice is remembered. Tune the mood in
  `src/audio.js` (scale `CENTS`, `CHORDS`, phrase rhythm in `phrase()`).
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
