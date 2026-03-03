import { C } from '../../tokens'
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}
