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
   * `cover.jpg` is the hero image and the WORKS stage image
   * `01.jpg`, `02.jpg`, … become the editorial sequence on that project's page
   * the folder name must equal the project's `slug` in `src/content.js`
4. To add a project, add an entry to `projectData` and create its folder.

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
