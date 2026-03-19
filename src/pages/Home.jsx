// src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Clock, ParkingSquare, Plus, ArrowRight, X, QrCode,
  ShieldCheck, Zap, Activity, BarChart2,
} from 'lucide-react'
import { C, FF, GRAD, MAIN_TITLE_SIZE } from '../tokens'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button } from '../components/ui/Button'
import { auth } from '../utils/auth'

const fmtHora = (dt) => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''

const fmtFecha = (dateStr) => {
  if (!dateStr) return ''
  const hoy = new Date().toISOString().split('T')[0]
  const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === hoy) return 'Hoy'
  if (dateStr === manana) return 'Manana'
  return new Date(dateStr).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function FeatureTile({ title, sub, Icon, color = '#ff4d6d', span = 'span 3' }) {
  return (
    <Card
      className="enter-up"
      style={{
        gridColumn: span,
        minHeight: 130,
        padding: '16px 16px 14px',
        borderRadius: 24,
        background: 'radial-gradient(circle at 86% 10%, rgba(255,255,255,.14), transparent 34%), linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.02) 44%, rgba(255,255,255,.01)), #07090d',
        border: '1px solid rgba(255,255,255,.11)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: color + '1f', border: `1px solid ${color}44`, display: 'grid', placeItems: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <p style={{ marginTop: 16, fontSize: 24, lineHeight: 1.06, color: C.text, fontWeight: 760, letterSpacing: '-.02em', fontFamily: FF }}>
        {title}
      </p>
      <p style={{ marginTop: 5, fontSize: 12.5, color: C.muted, fontFamily: FF }}>
        {sub}
      </p>
    </Card>
  )
}

export default function Home() {
  const nav = useNavigate()
  const user = auth.user()

  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(null)

  useEffect(() => {
    auth.fetchAuth('/api/reservas/mis-reservas')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setReservas(Array.isArray(data) ? data : []))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [])

  const cancelar = async (id) => {
    setCanceling(id)
    try {
      const res = await auth.fetchAuth(`/api/reservas/${id}/cancelar`, { method: 'PATCH' })
      if (res.ok) {
        setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estado: 'CANCELADA' } : r)))
      }
    } catch { /* ignore */ }
    finally { setCanceling(null) }
  }

  const hoy = new Date().toISOString().split('T')[0]
  const activa = reservas.find((r) => r.estado === 'ACTIVA' && r.fechaReserva === hoy)
  const proximas = reservas
    .filter((r) => ['ACTIVA'].includes(r.estado) && r.fechaReserva >= hoy)
    .slice(0, 4)
  const totalSemana = reservas.filter((r) => {
    const f = r.fechaReserva
    const ini = hoy
    const fin = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    return f >= ini && f <= fin
  }).length

  const activasHoy = reservas.filter((r) => r.estado === 'ACTIVA').length
  const completadas = reservas.filter((r) => r.estado === 'COMPLETADA').length
  const saludo = new Date().getHours() < 12 ? 'Buenos dias' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '30px 16px 56px' }}>
      <div className="enter-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 5, fontFamily: FF }}>{saludo}</p>
          <h1 style={{
            fontSize: MAIN_TITLE_SIZE,
            fontWeight: 800,
            fontFamily: FF,
            letterSpacing: '-.03em',
            background: GRAD,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {user?.nombre} {user?.apellido}
          </h1>
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'rgba(255,77,109,.10)',
          border: '1px solid rgba(255,77,109,.35)',
          display: 'grid', placeItems: 'center',
          color: '#ff8ea4',
        }}>
          <Bell size={18} />
        </button>
      </div>

      <div className="bento-grid">
        <FeatureTile title="QR Scan" sub="Check-in instantaneo" Icon={QrCode} color="#ff4d6d" />
        <FeatureTile title="Siempre listo" sub="Reserva en segundos" Icon={Zap} color="#ff7a9a" />
        <FeatureTile title="Modo Seguro" sub="Validacion por horario" Icon={ShieldCheck} color="#ff6b88" />
        <FeatureTile title="Live State" sub="Disponibilidad en vivo" Icon={Activity} color="#8d6bff" />

        <Card
          className="enter-up"
          style={{
            gridColumn: 'span 8',
            minHeight: 350,
            borderRadius: 28,
            overflow: 'hidden',
            padding: '24px 24px 22px',
            position: 'relative',
            background: activa
              ? 'radial-gradient(circle at 80% 20%, rgba(255,77,109,.30), transparent 42%), radial-gradient(circle at 12% 80%, rgba(123,165,255,.20), transparent 44%), #020303'
              : 'radial-gradient(circle at 78% 16%, rgba(255,107,136,.24), transparent 42%), radial-gradient(circle at 16% 82%, rgba(141,107,255,.20), transparent 42%), #020303',
            border: '1px solid rgba(255,255,255,.11)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.01) 30%, rgba(0,0,0,.3) 100%)' }} />
          <div style={{ position: 'absolute', right: -62, top: -54, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)' }} />
          <div style={{ position: 'absolute', left: 30, bottom: -80, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <SectionLabel style={{ color: '#ffb8c5', marginBottom: 10 }}>
              {activa ? 'Reserva activa' : 'NoParking Pro'}
            </SectionLabel>
            <h2 style={{ fontSize: 58, lineHeight: .96, fontWeight: 820, color: '#ffeff3', letterSpacing: '-.04em', fontFamily: FF, marginBottom: 10 }}>
              {activa ? 'Spot ' + activa.codigoEspacio : 'Smart Parking'}
            </h2>
            <p style={{ maxWidth: 510, color: '#d8bed0', fontSize: 14, lineHeight: 1.6, fontFamily: FF, marginBottom: 20 }}>
              {activa
                ? `${activa.zonaNombre} - ${activa.sedeNombre}. ${fmtHora(activa.fechaInicio)} a ${fmtHora(activa.fechaFin)}.`
                : 'Reserva por bloque horario, escanea QR para activar y gestiona tu espacio desde un solo dashboard.'}
            </p>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {activa ? (
                <>
                  <Button onClick={() => nav('/reservas')} style={{ background: GRAD, border: 'none', color: '#fff', boxShadow: '0 12px 28px rgba(255,77,109,.26)' }} icon={ArrowRight}>
                    Ver reserva
                  </Button>
                  <Button
                    onClick={() => cancelar(activa.id)}
                    disabled={canceling === activa.id}
                    style={{ background: 'rgba(255,77,109,.20)', border: '1px solid rgba(255,77,109,.48)', color: '#fff', boxShadow: 'none' }}
                    icon={X}
                  >
                    {canceling === activa.id ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => nav('/reservar')} icon={Plus}>
                  Reservar ahora
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card
          className="enter-up"
          style={{
            gridColumn: 'span 4',
            minHeight: 350,
            borderRadius: 28,
            padding: 18,
            background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 42%, rgba(255,255,255,.01)), #06080c',
            border: '1px solid rgba(255,255,255,.11)',
          }}
        >
          <SectionLabel style={{ marginBottom: 10 }}>Metricas</SectionLabel>
          {[
            { label: 'Activas hoy', value: loading ? '...' : activasHoy, color: '#ff4d6d' },
            { label: 'Esta semana', value: loading ? '...' : totalSemana, color: '#ff7a9a' },
            { label: 'Completadas', value: loading ? '...' : completadas, color: '#8d6bff' },
          ].map((k) => (
            <div key={k.label} style={{
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '11px 12px',
              marginBottom: 9,
              background: 'rgba(255,255,255,.02)',
            }}>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>{k.label}</p>
              <p style={{ fontSize: 30, lineHeight: 1, color: k.color, fontWeight: 790, letterSpacing: '-.03em', fontFamily: FF }}>{k.value}</p>
            </div>
          ))}
          <div style={{ marginTop: 8, border: `1px solid ${C.border}`, borderRadius: 13, padding: '9px 10px', background: 'rgba(255,255,255,.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} color={C.muted} />
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Rendimiento</span>
            </div>
            <Badge color="#ff4d6d">Estable</Badge>
          </div>
        </Card>

        <Card
          className="enter-up"
          style={{
            gridColumn: 'span 5',
            minHeight: 270,
            borderRadius: 26,
            padding: '18px 16px',
            background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 42%, rgba(255,255,255,.01)), #07090d',
            border: '1px solid rgba(255,255,255,.11)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionLabel style={{ marginBottom: 0 }}>Proximas reservas</SectionLabel>
            <Button variant="ghost" onClick={() => nav('/reservar')} icon={Plus} style={{ padding: '7px 12px' }}>
              Nueva
            </Button>
          </div>

          {loading ? (
            <p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>Cargando reservas...</p>
          ) : proximas.length === 0 ? (
            <p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>No hay reservas proximas.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {proximas.map((r, i) => {
                const colors = ['#ff4d6d', '#ff7a9a', '#8d6bff', '#ff6b88']
                const color = colors[i % colors.length]
                return (
                  <div key={r.id} style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: '10px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    background: 'rgba(255,255,255,.02)',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '1e', border: `1px solid ${color}55`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <ParkingSquare size={15} color={color} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 660, color: C.text, fontFamily: FF }}>
                        {r.codigoEspacio} - {r.zonaNombre}
                      </p>
                      <p style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, marginTop: 2 }}>
                        {fmtFecha(r.fechaReserva)} - {fmtHora(r.fechaInicio)} a {fmtHora(r.fechaFin)}
                      </p>
                    </div>
                    <Badge color={color}>{fmtFecha(r.fechaReserva)}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <FeatureTile title="Always On" sub="Estado del bloque activo" Icon={Clock} color="#ff6b88" span="span 3" />
        <FeatureTile title="Fast Charge" sub="Flujo de reserva optimizado" Icon={Zap} color="#ff4d6d" span="span 4" />
      </div>
    </div>
  )
}
