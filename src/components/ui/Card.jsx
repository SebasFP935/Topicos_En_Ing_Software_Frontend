import { C } from '../../tokens'
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`upb-card ${onClick ? 'upb-card--interactive' : ''}`.trim()}
      style={{
        background: `linear-gradient(180deg, ${C.s2} 0%, ${C.surface} 100%)`,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '18px 20px',
        transition: 'border-color .2s ease, box-shadow .2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
