import { GRAD } from '../../tokens'
export function GradText({ children, style = {} }) {
  return (
    <span
      style={{
        background: `${GRAD}, linear-gradient(135deg, #ffcc00 0%, #f8d600 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
