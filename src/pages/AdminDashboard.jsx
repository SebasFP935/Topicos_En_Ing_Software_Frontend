import { BarChart2, CalendarCheck, Clock, Users, TrendingUp, Activity, CheckCircle, CircleCheck, CircleX, ParkingSquare } from 'lucide-react'
import { C, GRAD, BLOQUES } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'

const FF = "'Plus Jakarta Sans', sans-serif"

const KPIS = [
  { label: 'Ocupacion actual', value: '68%',   sub: '54 de 80 espacios',        color: '#ffaa00', Icon: BarChart2    },
  { label: 'Reservas del dia', value: '47',    sub: '+12 vs. ayer',              color: '#5b7eff', Icon: CalendarCheck },
  { label: 'Hora pico',        value: '10:00', sub: 'Horario B mas solicitado',  color: '#a259ff', Icon: Clock        },
  { label: 'Usuarios activos', value: '1,247', sub: 'Registrados en el sistema', color: '#3de8c8', Icon: Users        },
]

const FEED = [
  { msg: 'Nueva reserva confirmada', det: 'Juan Perez · Espacio A-15 · Horario B',  t: 'hace 5 min',  Icon: CircleCheck, color: '#3de8c8' },
  { msg: 'Check-in completado',      det: 'Maria Gonzalez · Espacio B-22 · Horario B', t: 'hace 12 min', Icon: CheckCircle, color: '#5b7eff' },
  { msg: 'Reserva cancelada',        det: 'Luis Torres · Espacio C-08 · Horario C',  t: 'hace 18 min', Icon: CircleX,     color: '#ff4d6d' },
  { msg: 'Nueva reserva confirmada', det: 'Ana Romero · Espacio A-03 · Horario A',   t: 'hace 25 min', Icon: CircleCheck, color: '#3de8c8' },
]

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 28px 56px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: FF }}><GradText>Dashboard Admin</GradText></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3de8c814', border: '1px solid #3de8c830', borderRadius: 100, padding: '6px 14px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3de8c8' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#3de8c8', fontFamily: FF }}>En vivo</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        {KPIS.map(k => (
          <Card key={k.label} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.Icon size={16} color={k.color} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, lineHeight: 1.35, fontFamily: FF }}>{k.label}</p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: FF }}>{k.value}</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 5, fontFamily: FF }}>{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Feed side by side on wide screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Bar chart */}
        <Card style={{ padding: '20px 22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <TrendingUp size={16} color={C.accent} />
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FF }}>Ocupacion por Horario - Hoy</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
            {BLOQUES.map(b => {
              const high = b.pct >= 85
              return (
                <div key={b.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: high ? C.danger : C.muted, fontFamily: FF }}>{b.pct}%</span>
                  <div style={{
                    width: '100%', borderRadius: '5px 5px 0 0',
                    background: high ? 'linear-gradient(to top, #ff4d6d80, #a259ff80)' : GRAD.replace('135deg', 'to top') + '45',
                    height: b.pct + '%',
                    boxShadow: high ? '0 0 12px #ff4d6d30' : 'none',
                    transition: 'height .4s',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: FF }}>{b.id}</span>
                  <span style={{ fontSize: 9, color: C.muted + 'aa', fontFamily: FF, textAlign: 'center', lineHeight: 1.3 }}>{b.time.split(' - ')[0]}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
            {[['Alta demanda', C.danger], ['Normal', C.accent]].map(([l, col]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted, fontFamily: FF }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} /> {l}
              </div>
            ))}
          </div>
        </Card>

        {/* Activity feed */}
        <Card style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Activity size={16} color={C.accent} />
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FF }}>Actividad Reciente</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FEED.map((a, i) => {
              const Icon = a.Icon
              return (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  paddingBottom: i < FEED.length - 1 ? 14 : 0,
                  marginBottom: i < FEED.length - 1 ? 14 : 0,
                  borderBottom: i < FEED.length - 1 ? '1px solid ' + C.border : 'none',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={a.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{a.msg}</p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FF }}>{a.det}</p>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, fontFamily: FF }}>{a.t}</span>
                </div>
              )
            })}
          </div>
        </Card>

      </div>

      {/* Parking grid overview */}
      <div style={{ marginTop: 24 }}>
        <SectionLabel>Estado de espacios - Bloque A</SectionLabel>
        <Card style={{ padding: '20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 8 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const row = String.fromCharCode(65 + Math.floor(i / 5))
              const col = (i % 5) + 1
              const id = row + '-' + String(col).padStart(2, '0')
              const state = [3,6,9,12,15].includes(i) ? 'taken' : [1,7,13].includes(i) ? 'reserved' : i === 0 ? 'mine' : 'free'
              const sc = {
                free:     { bg: '#5b7eff14', border: '#5b7eff35', color: '#5b7eff' },
                taken:    { bg: '#ff4d6d10', border: '#ff4d6d25', color: '#ff4d6d' },
                reserved: { bg: '#a259ff12', border: '#a259ff28', color: '#a259ff' },
                mine:     { bg: '#3de8c820', border: '#3de8c850', color: '#3de8c8' },
              }[state]
              return (
                <div key={id} style={{ aspectRatio: '1', borderRadius: 10, background: sc.bg, border: '1.5px solid ' + sc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                  <ParkingSquare size={14} color={sc.color} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: sc.color, fontFamily: FF }}>{id}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[['Libre','#5b7eff'],['Ocupado','#ff4d6d'],['Reservado','#a259ff'],['Tuyo','#3de8c8']].map(([l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted, fontFamily: FF }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: c }} /> {l}
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}
