/**
 * Minimal SVG flags — ID and US. 16x12px, rounded-sm.
 * No external assets needed; drawn inline.
 */

export function FlagID({ className = 'w-4 h-3 rounded-[2px]' }) {
  return (
    <svg viewBox="0 0 16 12" className={className} aria-hidden="true">
      <rect width="16" height="12" fill="#CE1126" />
      <rect y="4" width="16" height="4" fill="#FFFFFF" />
    </svg>
  )
}

export function FlagUS({ className = 'w-4 h-3 rounded-[2px]' }) {
  const stripes = Array.from({ length: 7 }, (_, i) => (
    <rect key={i} y={i * 2} width="16" height="1.714" fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'} />
  ))
  return (
    <svg viewBox="0 0 16 12" className={className} aria-hidden="true">
      {stripes}
      <rect width="8" height="6.86" fill="#3C3B6E" />
    </svg>
  )
}

export default function Flag({ country, ...props }) {
  return country === 'id' ? <FlagID {...props} /> : <FlagUS {...props} />
}
