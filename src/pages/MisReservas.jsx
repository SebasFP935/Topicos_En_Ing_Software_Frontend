// src/pages/MisReservas.jsx
import { useState, useEffect } from 'react'
import { Clock, Calendar, ParkingSquare, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card }         from '../components/ui/Card'
import { Badge }        from '../components/ui/Badge'
import { GradText }     from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { auth }         from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const fmtHora  = dt => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''
const fmtFecha = d  => d  ? new Date(d + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

const EST = {
  ACTIVA:      { label: 'Activa',      color: '#3de8c8', Icon: CheckCircle   },
  COMPLETADA:  { label: 'Completada',  color: '#6b7099', Icon: CheckCircle   },
  CANCELADA:   { label: 'Cancelada',   color: '#ff4d6d', Icon: X             },
  NO_SHOW:     { label: 'No-show',     color: '#ffaa00', Icon: AlertTriangle  },
}

function ReservaCard({ r, onCancelar, canceling }) {
  const E     = EST[r.estado] || EST.ACTIVA
  const Icon  = E.Icon
  const activa = r.estado === 'ACTIVA'

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: E.color + '16', border: '1px solid ' + E.color + '28',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ParkingSquare size={22} color={E.color} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FF }}>
              Espacio {r.codigoEspacio}
            </p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: FF }}>
              {r.zonaNombre} · {r.sedeNombre}
            </p>
          </div>
        </div>
        <Badge color={E.color}>{E.label}</Badge>
      </div>

      <div style={{
        background: C.bg, borderRadius: 10, padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} color={C.muted} />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: FF }}>
            {fmtFecha(r.fechaReserva)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} color={C.muted} />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: FF }}>
            {fmtHora(r.fechaInicio)} - {fmtHora(r.fechaFin)}
          </span>
        </div>
      </div>

      {/* QR code si está activa */}
      {activa && r.codigoQr && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8,
          background: '#5b7eff10', border: '1px solid #5b7eff25',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: C.accent, fontFamily: FF, fontWeight: 600 }}>QR:</span>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontFamily: 'monospace' }}>
            {r.codigoQr}
          </span>
        </div>
      )}

      {activa && (
        <button
          onClick={() => onCancelar(r.id)}
          disabled={canceling === r.id}
          style={{
            width: '100%', marginTop: 12,
            background: '#ff4d6d12', border: '1px solid #ff4d6d28',
            color: '#ff4d6d', padding: '9px', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, cursor: canceling === r.id ? 'default' : 'pointer', fontFamily: FF,
          }}
        >
          <X size={14} />
          {canceling === r.id ? 'Cancelando...' : 'Cancelar reserva'}
        </button>
      )}
    </Card>
  )
}

export default function MisReservas() {
  const [tab,       setTab]       = useState('activas')
  const [reservas,  setReservas]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [canceling, setCanceling] = useState(null)

  useEffect(() => {
    auth.fetchAuth('/api/reservas/mis-reservas')
      .then(r => r.ok ? r.json() : [])
      .then(data => setReservas(Array.isArray(data) ? data : []))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [])

  const cancelar = async id => {
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

  const activas   = reservas.filter(r => r.estado === 'ACTIVA')
  const historial = reservas.filter(r => r.estado !== 'ACTIVA')

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 28px 56px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28, fontFamily: FF }}>
        <GradText>Mis reservas</GradText>
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: C.s2, borderRadius: 12,
        padding: 4, marginBottom: 28, border: '1px solid ' + C.border,
        width: 'fit-content', gap: 2,
      }}>
        {[['activas', `Activas (${activas.length})`], ['historial', `Historial (${historial.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '9px 28px', borderRadius: 10, border: 'none',
            background: tab === id ? GRAD : 'transparent',
            color: tab === id ? '#fff' : C.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all .15s', fontFamily: FF,
          }}>{label}</button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: 'spin .8s linear infinite' }} />
          <span style={{ color: C.muted, fontFamily: FF, fontSize: 14 }}>Cargando reservas...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : tab === 'activas' ? (
        activas.length === 0 ? (
          <Card>
            <p style={{ color: C.muted, fontFamily: FF, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              No tienes reservas activas
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {activas.map(r => (
              <ReservaCard key={r.id} r={r} onCancelar={cancelar} canceling={canceling} />
            ))}
          </div>
        )
      ) : (
        historial.length === 0 ? (
          <Card>
            <p style={{ color: C.muted, fontFamily: FF, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Sin historial de reservas
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
            {historial.map(r => (
              <Card key={r.id} style={{ opacity: r.estado === 'NO_SHOW' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {(() => { const E = EST[r.estado] || EST.COMPLETADA; const Icon = E.Icon; return <Icon size={16} color={E.color} /> })()}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FF }}>
                        Espacio {r.codigoEspacio} · {r.zonaNombre}
                      </p>
                      <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>
                        {fmtFecha(r.fechaReserva)} · {fmtHora(r.fechaInicio)} - {fmtHora(r.fechaFin)}
                      </p>
                    </div>
                  </div>
                  <Badge color={(EST[r.estado] || EST.COMPLETADA).color}>
                    {(EST[r.estado] || EST.COMPLETADA).label}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}