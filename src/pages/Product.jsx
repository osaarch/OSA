import { Component, lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'
import { Arrow } from '../ui/Arrow'
import { buildBlocks, Caption } from './Project'

// The 3D viewer (three.js) and the concept drawing load only when a piece is opened.
const ProductViewer = lazy(() => import('../ui/ProductViewer'))
const PodiumConcept = lazy(() => import('../ui/PodiumConcept'))
const FIGURES = { podium: PodiumConcept }

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.error('Product 3D viewer failed:', err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch (e) {
    return false
  }
}

// A piece of design: its name and the idea, a small 3D model to turn with the pointer (like a piece
// shown for sale), the drawing of how the form came about, and the renders.
export default function Product({ slug, go }) {
  const { findProduct, categories, ui } = useI18n()
  const piece = findProduct(slug)
  const backPath = `/works/${piece?.category || 'products'}`
  const backLabel = categories.find((c) => c.slug === piece?.category)?.title || ui.worksTitle
  const [url, setUrl] = useState(null)
  const [webgl] = useState(hasWebGL)
  const Figure = piece && FIGURES[piece.figure]
  const blocks = useMemo(() => (piece ? buildBlocks(piece) : []), [piece])

  useEffect(() => {
    if (!piece?.model) return
    if (!__SINGLE__) {
      setUrl(piece.model)
      return
    }
    let dead = false
    import('../ui/singleProduct.js').then((m) => !dead && setUrl(m.models[piece.slug]))
    return () => {
      dead = true
    }
  }, [piece])

  const toBack = (e) => {
    e.preventDefault()
    go(backPath)
  }

  if (!piece) {
    return (
      <main className="page project">
        <div className="notfound">
          <p>{ui.pieceNotFound}</p>
          <a href={href(backPath)} className="link-arrow" onClick={toBack}>
            {ui.worksTitle} <Arrow />
          </a>
        </div>
      </main>
    )
  }

  const meta = [
    [ui.meta.location, piece.location],
    [ui.meta.type, piece.type],
    [ui.meta.format, piece.format],
  ].filter(([, v]) => v)

  const still = <Frame src={piece.cover} alt={piece.title} eager />

  return (
    <main className="page project product" aria-labelledby="product-title">
      <a href={href(backPath)} className="back" onClick={toBack}>
        <Arrow dir="left" className="arr-back" /> {backLabel}
      </a>

      <div className="p-body">
        <header className="pb-head">
          <Reveal as="p" className="kicker">
            {piece.type}
          </Reveal>
          <Reveal as="h1" id="product-title" delay={0.06}>
            {piece.title}
          </Reveal>
          <Reveal as="p" className="hero-sum" delay={0.12}>
            {piece.summary}
          </Reveal>
        </header>

        {/* the model: small, on the page's black, turned with the pointer */}
        <Reveal as="section" className="pd-view" delay={0.1}>
          {webgl && url ? (
            <Boundary fallback={<div className="pd-still">{still}</div>}>
              <Suspense fallback={null}>
                <ProductViewer url={url} label={`${piece.title} — ${ui.viewAria}`} />
              </Suspense>
            </Boundary>
          ) : !webgl ? (
            <div className="pd-still">{still}</div>
          ) : null}
        </Reveal>

        <section className="p-meta">
          {meta.map(([k, v], i) => (
            <Reveal key={k} delay={0.04 * i} className="meta-item">
              <span>{k}</span>
              <b>{v}</b>
            </Reveal>
          ))}
        </section>

        {piece.description?.length > 0 && (
          <section className="p-desc">
            <Reveal as="h2" className="label">
              {ui.pieceOverview}
            </Reveal>
            <div>
              {piece.description.map((t, i) => (
                <Reveal as="p" className="body lg" key={i} delay={0.05 * i}>
                  {t}
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {piece.concept?.text?.length > 0 && (
          <section className="p-desc p-concept">
            <Reveal as="h2" className="label">
              {ui.conceptTitle}
            </Reveal>
            <div>
              <Reveal as="h3" className="p-h3">
                {piece.concept.title}
              </Reveal>
              {piece.concept.text.map((t, i) => (
                <Reveal as="p" className="body lg" key={i} delay={0.05 * (i + 1)}>
                  {t}
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {Figure && (
          <Reveal as="section" className="pd-figure">
            <Suspense fallback={null}>
              <Figure stages={piece.figureStages} />
            </Suspense>
          </Reveal>
        )}

        {piece.hasImages && (
          <section className="p-seq" aria-label={`${piece.title} — images`}>
            {blocks.map((b, bi) => (
              <div className={`blk blk-${b.kind}`} key={bi}>
                {b.imgs.map((im, ii) => (
                  <Reveal as="figure" className="shot" key={ii} delay={0.08 * ii}>
                    <div className="shot-media">
                      <Frame src={im.src} alt={(typeof im.caption === 'string' ? im.caption : '') || piece.title} />
                    </div>
                    <Caption caption={im.caption} />
                  </Reveal>
                ))}
              </div>
            ))}
          </section>
        )}

        <footer className="p-next">
          <Reveal as="p" className="label">
            {ui.worksTitle}
          </Reveal>
          <a href={href(backPath)} className="next-link" onClick={toBack}>
            <span className="next-t">{backLabel}</span>
          </a>
        </footer>
      </div>
    </main>
  )
}
