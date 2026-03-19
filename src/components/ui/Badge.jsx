export function Badge({ children, color = '#5b7eff', style = {} }) {
  return (
    <span
      style={{
        background: color + '24',
        color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.01em',
        padding: '4px 11px',
        borderRadius: 100,
        border: `1px solid ${color}55`,
        whiteSpace: 'nowrap',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...style,
      }}
    >
      {children}
    </span>
  )
}
