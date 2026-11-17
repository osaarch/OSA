import { Component, lazy, Suspense, useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame } from '../ui/Frame'
import { href } from '../router'
import { Arrow } from '../ui/Arrow'

// The 3D viewer (three.js) loads only when a piece is opened.
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

// A piece of design: the object itself, on the page's black, to turn with the pointer — and nothing
// written over it. A small drawing of how the form came about follows it, if the piece has one.
export default function Product({ slug, go }) {
  const { findProduct, categories, ui } = useI18n()
  const piece = findProduct(slug)
  const backPath = `/works/${piece?.category || 'products'}`
  const backLabel = categories.find((c) => c.slug === piece?.category)?.title || ui.worksTitle
  const [url, setUrl] = useState(null)
  const [webgl] = useState(hasWebGL)
  const Figure = piece && FIGURES[piece.figure]

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

  const back = (
    <a
      href={href(backPath)}
      className="back"
      onClick={(e) => {
        e.preventDefault()
        go(backPath)
      }}
    >
      <Arrow dir="left" className="arr-back" /> {backLabel}
    </a>
  )

  if (!piece) {
    return (
      <main className="page product">
        <div className="notfound">
          <p>{ui.pieceNotFound}</p>
          <a
            href={href(backPath)}
            className="link-arrow"
            onClick={(e) => {
              e.preventDefault()
              go(backPath)
            }}
          >
            {ui.worksTitle} <Arrow />
          </a>
        </div>
      </main>
    )
  }

  const still = <Frame src={piece.cover} alt={piece.title} eager />

  return (
    <main className="page product" aria-label={piece.title}>
      <h1 className="pj-sr">{piece.title}</h1>
      {back}
      <section className="pd-stage">
        {webgl && url ? (
          <Boundary fallback={<div className="pd-still">{still}</div>}>
            <Suspense fallback={null}>
              <ProductViewer url={url} label={`${piece.title} — ${ui.viewAria}`} />
            </Suspense>
          </Boundary>
        ) : !webgl ? (
          <div className="pd-still">{still}</div>
        ) : null}
        {Figure && (
          <span className="pd-more" aria-hidden="true">
            <Arrow dir="down" className="arr-down" />
          </span>
        )}
      </section>
      {Figure && (
        <section className="pd-figure">
          <Suspense fallback={null}>
            <Figure />
          </Suspense>
        </section>
      )}
    </main>
  )
}
