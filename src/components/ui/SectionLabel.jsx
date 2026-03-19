import { C } from '../../tokens'
export function SectionLabel({ children, style = {} }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.teal,
        letterSpacing: '.11em',
        textTransform: 'uppercase',
        marginBottom: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...style,
      }}
    >
      {children}
    </p>
  )
}
