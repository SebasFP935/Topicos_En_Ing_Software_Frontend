import { C, FF } from '../../tokens'
export function SectionLabel({ children, style = {} }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12, fontFamily: FF, ...style }}>
      {children}
    </p>
  )
}
