import { useI18n } from '../i18n'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'
import { Arrow } from '../ui/Arrow'

// PRODUCTS — the second category: design objects. A grid of pieces; a piece with a 3D model
// carries a small "3D model" tag and opens its own page with a viewer sized to the object.
export default function Products({ go, cat: slug }) {
  const { products: all, categories, ui } = useI18n()
  const cat = categories.find((c) => c.slug === slug)
  const products = all.filter((p) => p.category === slug)
  return (
    <main className="page products" aria-labelledby="products-title">
      <header className="pr-head">
        <a
          href={href('/works')}
          className="works-back"
          onClick={(e) => {
            e.preventDefault()
            go('/works')
          }}
        >
          <Arrow dir="left" className="arr-back" /> {ui.worksTitle}
        </a>
        <h1 id="products-title">{cat?.title}</h1>
        <p className="hero-sum">{cat?.text}</p>
      </header>

      <ul className={`pr-grid${products.length === 1 ? ' is-single' : ''}`}>
        {products.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={0.07 * i}>
            <a
              href={href(`/works/piece/${p.slug}`)}
              className="pr-card"
              onClick={(e) => {
                e.preventDefault()
                go(`/works/piece/${p.slug}`)
              }}
            >
              <div className="pr-media">
                <Frame src={p.cover} alt={p.title} label={p.title} />
                {p.model && <span className="pr-tag">{ui.model3d}</span>}
              </div>
              <div className="pr-cap">
                <span className="pr-name">{p.title}</span>
                <span className="pr-meta">{[p.location, p.year].filter(Boolean).join(' · ')}</span>
                <span className="pr-open">
                  {ui.openPiece} <Arrow />
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </ul>
      <p className="pr-soon">{ui.productsSoon}</p>
    </main>
  )
}
