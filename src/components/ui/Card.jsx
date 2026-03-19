import { C } from '../../tokens'
export function Card({ children, style = {}, onClick, className }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: `linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 42%, rgba(255,255,255,.01)), ${C.s2}cc`,
        border: `1px solid ${C.border}`,
        borderRadius: 22,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 14px 34px rgba(0,0,0,.28)',
        padding: '18px 20px',
        transition: 'transform .22s ease, border-color .22s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
