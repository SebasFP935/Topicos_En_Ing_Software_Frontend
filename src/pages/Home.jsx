// src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Clock, BarChart2, Car, ParkingSquare, Plus, CheckCircle, ArrowRight, X } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card }         from '../components/ui/Card'
import { Badge }        from '../components/ui/Badge'
import { GradText }     from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button }       from '../components/ui/Button'
import { auth }         from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

// Formatea "2026-02-18T10:00:00" → "10:00"
const fmtHora = dt => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''

// Formatea fecha relativa
const fmtFecha = dateStr => {
  if (!dateStr) return ''
  const hoy    = new Date().toISOString().split('T')[0]
  const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === hoy)    return 'Hoy'
  if (dateStr === manana) return 'Mañana'
  return new Date(dateStr).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

const ESTADO_COLOR = {
  ACTIVA:      C.teal,
  CONFIRMADA:  C.accent,
  COMPLETADA:  C.muted,
  CANCELADA:   C.danger,
  NO_SHOW:     C.warn,
}

export default function Home() {
  const nav  = useNavigate()
  const user = auth.user()

  const [reservas,   setReservas]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [canceling,  setCanceling]  = useState(null)

  // ── Cargar reservas del usuario ──────────────────────────────────────
  useEffect(() => {
    auth.fetchAuth('/api/reservas/mis-reservas')
      .then(r => r.ok ? r.json() : [])
      .then(data => setReservas(Array.isArray(data) ? data : []))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [])

  // ── Cancelar reserva ─────────────────────────────────────────────────
  const cancelar = async (id) => {
    setCanceling(id)
    try {
      const res = await auth.fetchAuth(`/api/reservas/${id}/cancelar`, {
        method: 'PATCH'})
      if (res.ok) {
        setReservas(prev => prev.map(r =>
          r.id === id ? { ...r, estado: 'CANCELADA' } : r
        ))
      }
    } catch { /* ignorar */ }
    finally { setCanceling(null) }
  }

  // ── Derivar datos ────────────────────────────────────────────────────
  const hoy       = new Date().toISOString().split('T')[0]
  const activa    = reservas.find(r => r.estado === 'ACTIVA' && r.fechaReserva === hoy)
  const proximas  = reservas
    .filter(r => ['ACTIVA'].includes(r.estado) && r.fechaReserva >= hoy)
    .slice(0, 3)
  const totalSemana = reservas.filter(r => {
    const f = r.fechaReserva
    const ini = hoy
    const fin = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    return f >= ini && f <= fin
  }).length

  const COLORS = [C.accent, C.purple, C.teal]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 56px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 4, fontFamily: FF }}>
            {new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'}
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: C.text, fontFamily: FF, letterSpacing: '-0.02em' }}>
            {user?.nombre} {user?.apellido} 👋
          </h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontFamily: FF }}>
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: '50%',
          background: C.accent + '14', border: '1px solid ' + C.border,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0, cursor: 'pointer',
        }}>
          <Bell size={18} color={C.muted} />
        </button>
      </div>

      {/* Reserva activa hero */}
      {activa ? (
        <div style={{
          background: GRAD, borderRadius: 20, padding: '24px 28px',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: '#ffffff15' }} />
          <div style={{ position: 'absolute', right: 40, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: '#ffffff10' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: '#ffffffaa', fontFamily: FF, marginBottom: 6, letterSpacing: 1 }}>
            ✓ RESERVA ACTIVA
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: FF, marginBottom: 6 }}>
            {activa.codigoEspacio} · {activa.zonaNombre}
          </h2>
          <p style={{ fontSize: 14, color: '#ffffffcc', fontFamily: FF, marginBottom: 20 }}>
            <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
            {fmtHora(activa.fechaInicio)} - {fmtHora(activa.fechaFin)} · {activa.sedeNombre}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => nav('/reservas')}
              style={{
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.45)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FF,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Ver reserva <ArrowRight size={14} />
            </button>
            <button
              onClick={() => cancelar(activa.id)}
              disabled={canceling === activa.id}
              style={{
                padding: '9px 18px', borderRadius: 10,
                background: C.warn + '30', border: `1px solid ${C.warn}66`,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FF,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <X size={14} /> {canceling === activa.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: C.surface, border: `1px dashed ${C.border}`,
          borderRadius: 20, padding: '24px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FF, marginBottom: 4 }}>
              Sin reserva activa hoy
            </p>
            <p style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>
              Reserva tu espacio de parqueo para hoy
            </p>
          </div>
          <Button variant="primary" onClick={() => nav('/reservar')} icon={Plus}>
            Reservar
          </Button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { label: 'Mis reservas',    val: loading ? '...' : reservas.filter(r => r.estado === 'ACTIVA').length, sub: 'Activas ahora',   color: C.teal,   Icon: ParkingSquare },
          { label: 'Esta semana',     val: loading ? '...' : totalSemana, sub: 'Reservas programadas', color: C.accent, Icon: BarChart2     },
          { label: 'Completadas',     val: loading ? '...' : reservas.filter(r => r.estado === 'COMPLETADA').length, sub: 'Total histórico', color: C.warn, Icon: CheckCircle  },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: FF }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 34, fontWeight: 800, color: s.color, fontFamily: FF }}>{s.val}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 5, fontFamily: FF }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Próximas reservas */}
      <div style={{ maxWidth: 760 }}>
        <SectionLabel>Próximas reservas</SectionLabel>
        {loading ? (
          <Card><p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>Cargando...</p></Card>
        ) : proximas.length === 0 ? (
          <Card>
            <p style={{ color: C.muted, fontFamily: FF, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
              No tienes reservas próximas
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximas.map((r, i) => (
              <Card key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: COLORS[i % 3] + '18',
                  border: '1px solid ' + COLORS[i % 3] + '30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <ParkingSquare size={22} color={COLORS[i % 3]} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FF }}>
                    {r.codigoEspacio} · {r.zonaNombre}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <Clock size={12} color={C.muted} />
                    <p style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>
                      {fmtFecha(r.fechaReserva)} · {fmtHora(r.fechaInicio)} - {fmtHora(r.fechaFin)}
                    </p>
                  </div>
                </div>
                <Badge color={COLORS[i % 3]}>{fmtFecha(r.fechaReserva)}</Badge>
              </Card>
            ))}
          </div>
        )}
        <Button variant="primary" onClick={() => nav('/reservar')} icon={Plus}
          style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
          Nueva reserva
        </Button>
      </div>
    </div>
  )
}
