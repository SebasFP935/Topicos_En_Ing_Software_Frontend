import { GRAD, C, FF } from '../../tokens'
export function Button({ children, variant = 'primary', onClick, disabled, style = {}, icon: Icon }) {
  const variants = {
    primary: { background: GRAD, color: '#fff6f8', border: 'none', boxShadow: '0 12px 34px rgba(0,104,183,.28)' },
    ghost:   { background: 'rgba(255,255,255,.02)', color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: C.danger + '12', color: C.danger, border: `1px solid ${C.danger}40` },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        borderRadius: 13,
        padding: '11px 22px',
        fontSize: 14,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'opacity .18s, transform .18s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontFamily: FF,
        letterSpacing: '.01em',
        ...variants[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

