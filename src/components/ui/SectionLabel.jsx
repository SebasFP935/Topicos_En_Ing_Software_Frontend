import { C } from '../../tokens'
export function SectionLabel({ children, style = {} }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", ...style }}>
      {children}
    </p>
  )
}
