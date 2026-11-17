// The small waw-shaped damma that sits over the O of the OSA mark, its tail touching the O's top-right.
// It belongs inside a `.o` span (position: relative, line-height: 1) around the O; everything is in em, so
// it scales with the word and takes the colour of the text.
export default function Damma() {
  return (
    <svg className="damma" viewBox="-1 -1 11 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="3" r="2" />
        <path d="M 7.4 5.2 C 7.8 8.5, 7.2 10.2, 5.0 11.3 S 2.2 12.7 0.6 13.2" />
      </g>
    </svg>
  )
}
