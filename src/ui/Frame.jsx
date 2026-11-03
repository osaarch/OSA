import { useEffect, useRef } from 'react'

// A photograph — or, until one is supplied, an honest empty frame (never a fake
// image). Drop files into src/assets/… and the frames fill themselves.
export function Frame({ src, alt = '', label, eager = false, className = '' }) {
  if (src) {
    return (
      <img
        className={`frame-img ${className}`}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
      />
    )
  }
  return (
    <div className={`frame-ph ${className}`} role="img" aria-label={alt || label || 'Image placeholder'}>
      {label && <span className="ph-label">{label}</span>}
    </div>
  )
}

// Fade/slide an element in the first time it scrolls into view.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`rv ${className}`} style={{ '--d': delay }} {...rest}>
      {children}
    </Tag>
  )
}
