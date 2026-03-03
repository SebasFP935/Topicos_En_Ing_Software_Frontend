export const C = {
  bg:      '#06060f',
  surface: '#0d0e1f',
  s2:      '#13142a',
  border:  '#1e2040',
  accent:  '#5b7eff',
  purple:  '#a259ff',
  teal:    '#3de8c8',
  text:    '#e8eaf8',
  muted:   '#6b7099',
  danger:  '#ff4d6d',
  warn:    '#ffaa00',
}
export const GRAD = 'linear-gradient(135deg, #5b7eff 0%, #a259ff 100%)'

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
