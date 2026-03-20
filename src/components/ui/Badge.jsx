import { FF } from '../../tokens'

export function Badge({ children, color = '#7ba5ff', style = {} }) {
  return (
    <span style={{ background: color + '1f', color, border: `1px solid ${color}44`, fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 100, whiteSpace: 'nowrap', fontFamily: FF, ...style }}>
      {children}
    </span>
  )
}

