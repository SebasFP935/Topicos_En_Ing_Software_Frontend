export const C = {
  bg:      '#050608',
  surface: '#0b0d11',
  s2:      '#15181f',
  border:  '#2a2e37',
  accent:  '#ff4d6d',
  purple:  '#8d6bff',
  teal:    '#7ba5ff',
  text:    '#eef1f7',
  muted:   '#8d95a6',
  danger:  '#ff4d6d',
  warn:    '#ff6b88',
}
export const GRAD = 'linear-gradient(130deg, #ff3f5e 0%, #ff6b88 48%, #7ba5ff 100%)'
export const FF = "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const MAIN_TITLE_SIZE = 'clamp(40px, 5.2vw, 58px)'

export const BLOQUES = [
  { id: 'A', label: 'Horario A', time: '7:45 - 9:45',   pct: 85 },
  { id: 'B', label: 'Horario B', time: '10:00 - 12:00',  pct: 92 },
  { id: 'C', label: 'Horario C', time: '12:15 - 14:15',  pct: 78 },
  { id: 'D', label: 'Horario D', time: '14:30 - 16:30',  pct: 65 },
  { id: 'E', label: 'Horario E', time: '16:45 - 18:45',  pct: 45 },
  { id: 'F', label: 'Horario F', time: '19:00 - 21:00',  pct: 38 },
]
export const DISPONIBLES = {
  hoy:    { A: 12, B: 34, C: 28, D: 41, E: 55, F: 62 },
  manana: { A:  5, B:  8, C: 20, D: 38, E: 60, F: 72 },
  pasado: { A: 30, B: 44, C: 35, D: 50, E: 65, F: 73 },
}
export const TOTAL = 80
