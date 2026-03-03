import { GRAD } from '../../tokens'
export function GradText({ children, style = {} }) {
  return (
    <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', ...style }}>
      {children}
    </span>
  )
}
