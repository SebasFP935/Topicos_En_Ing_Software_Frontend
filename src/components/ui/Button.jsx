import { GRAD, C } from '../../tokens'
export function Button({ children, variant = 'primary', onClick, disabled, style = {}, icon: Icon }) {
  const variants = {
    primary: { background: GRAD, color: '#fff', border: 'none', boxShadow: '0 4px 20px rgba(91,126,255,.25)' },
    ghost:   { background: 'transparent', color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: C.danger + '12', color: C.danger, border: `1px solid ${C.danger}28` },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'opacity .15s', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", ...variants[variant], ...style }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
