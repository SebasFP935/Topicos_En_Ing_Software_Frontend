import { GRAD, C } from '../../tokens'
export function Button({ children, variant = 'primary', onClick, disabled, style = {}, icon: Icon }) {
  const variants = {
    primary: { background: GRAD, color: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(0,104,183,.28)' },
    ghost:   { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: C.danger + '1f', color: '#fff', border: `1px solid ${C.danger}75` },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`upb-btn--${variant}`}
      style={{
        borderRadius: 12,
        padding: '11px 22px',
        fontSize: 14,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        letterSpacing: '0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...variants[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
