import { useNavigate } from 'react-router-dom'
import { Bell, Clock, BarChart2, Car, ParkingSquare, Plus, CheckCircle, ArrowRight, X } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button } from '../components/ui/Button'

const proximas = [
  { spot: 'A-07', bloque: 'Horario A', dia: 'Manana', hora: '7:45 - 9:45',   color: '#a259ff' },
  { spot: 'B-03', bloque: 'Horario C', dia: 'Jueves', hora: '12:15 - 14:15', color: '#5b7eff' },
]

export default function Home() {
  const nav = useNavigate()
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 56px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Buenos dias</p>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Josue C. 👋</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Miercoles, 18 de febrero de 2026</p>
        </div>
        <button style={{ width: 44, height: 44, borderRadius: '50%', background: C.accent + '14', border: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
          <Bell size={18} color={C.muted} />
          <div style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: '2px solid ' + C.surface }} />
        </button>
      </div>

      {/* Reserva activa hero */}
      <div style={{ background: GRAD, borderRadius: 24, padding: '32px 36px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <CheckCircle size={14} color="rgba(255,255,255,.8)" />
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.8)', letterSpacing: '.09em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Reserva activa</p>
        </div>
        <p style={{ fontSize: 38, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Horario B · A-12</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Clock size={15} color="rgba(255,255,255,.75)" />
          <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,.87)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>10:00 - 12:00 · Hoy miercoles 18</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => nav('/reservas')} style={{ background: 'rgba(255,255,255,.22)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Ver reserva <ArrowRight size={14} />
          </button>
          <button style={{ background: 'rgba(0,0,0,.2)', border: 'none', color: 'rgba(255,255,255,.75)', padding: '10px 20px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <X size={14} /> Cancelar
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { label: 'Ocupacion ahora', val: '68%', sub: '54 de 80 espacios', color: C.warn,   Icon: BarChart2     },
          { label: 'Espacios libres', val: '26',  sub: 'Disponibles ahora', color: C.teal,   Icon: Car           },
          { label: 'Mis reservas',    val: '3',   sub: 'Esta semana',       color: C.accent, Icon: ParkingSquare },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 34, fontWeight: 800, color: s.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.val}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Bottom two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'start' }}>
        <div>
          <SectionLabel>Proximas reservas</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximas.map(r => (
              <Card key={r.spot} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: r.color + '18', border: '1px solid ' + r.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ParkingSquare size={22} color={r.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Espacio {r.spot} · {r.bloque}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <Clock size={12} color={C.muted} />
                    <p style={{ fontSize: 13, color: C.muted, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{r.dia} · {r.hora}</p>
                  </div>
                </div>
                <Badge color={r.color}>{r.dia}</Badge>
              </Card>
            ))}
            <Button variant="primary" onClick={() => nav('/reservar')} icon={Plus} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              Nueva reserva
            </Button>
          </div>
        </div>

        <div>
          <SectionLabel>Aviso del dia</SectionLabel>
          <Card style={{ borderColor: C.warn + '35', background: C.warn + '08' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.warn + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} color={C.warn} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Hora pico identificada</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: C.warn, marginBottom: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>10:00 AM</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  El Horario B (10:00-12:00) tiene ocupacion del 92%. Reserva con anticipacion para asegurar tu espacio.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
