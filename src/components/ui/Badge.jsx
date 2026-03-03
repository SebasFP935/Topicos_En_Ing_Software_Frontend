export function Badge({ children, color = '#5b7eff', style = {} }) {
  return (
    <span style={{ background: color + '18', color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif", ...style }}>
      {children}
    </span>
  )
}
