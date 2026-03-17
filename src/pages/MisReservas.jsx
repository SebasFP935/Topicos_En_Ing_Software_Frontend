// src/pages/MisReservas.jsx
import { useState, useEffect } from 'react'
import { Clock, Calendar, ParkingSquare, CheckCircle, AlertTriangle, X, Info, ScanLine } from 'lucide-react'
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
  PENDIENTE_ACTIVACION: { label: 'Pendiente',  color: '#f59e0b', Icon: Clock         },
  ACTIVA:               { label: 'Activa',      color: '#3de8c8', Icon: CheckCircle   },
  COMPLETADA:           { label: 'Completada',  color: '#6b7099', Icon: CheckCircle   },
  CANCELADA:            { label: 'Cancelada',   color: '#ff4d6d', Icon: X             },
  NO_SHOW:              { label: 'No-show',      color: '#ffaa00', Icon: AlertTriangle  },
}

// ── Modal instrucciones activación ────────────────────────────────────────
function ModalActivacion({ reserva, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: FF,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: 28, maxWidth: 400, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(61,232,200,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScanLine size={20} color="#3de8c8" />
            </div>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Cómo activar tu reserva</div>
              <div style={{ color: C.muted, fontSize: 12 }}>Espacio {reserva.codigoEspacio} · {reserva.zonaNombre}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        {/* Info reserva */}
        <div style={{
          background: C.bg, borderRadius: 12, padding: '12px 16px',
          marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        }}>
          <div>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>FECHA</div>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{fmtFecha(reserva.fechaReserva)}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>HORARIO</div>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
              {fmtHora(reserva.fechaInicio)} – {fmtHora(reserva.fechaFin)}
            </div>
          </div>
        </div>

        {/* Pasos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {[
            { num: '1', color: '#3de8c8', rgb: '61,232,200', titulo: 'Llega a tu espacio', desc: `Dirígete al espacio ${reserva.codigoEspacio} en ${reserva.zonaNombre} dentro de tu horario reservado (puedes llegar hasta 5 min antes).` },
            { num: '2', color: '#a78bfa', rgb: '167,139,250', titulo: 'Escanea el QR del espacio', desc: 'Busca el código QR físico pegado en tu espacio. Ábrelo con la cámara del celular — esto activará tu reserva automáticamente.' },
            { num: '3', color: '#60a5fa', rgb: '96,165,250', titulo: 'Al salir, escanea de nuevo', desc: 'Cuando termines, vuelve a escanear el mismo QR del espacio para marcar tu salida y completar la reserva.' },
          ].map(p => (
            <div key={p.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                background: `rgba(${p.rgb},0.15)`, border: `1.5px solid ${p.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: p.color, flexShrink: 0,
              }}>{p.num}</div>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.titulo}</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 20,
        }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ color: '#f59e0b', fontSize: 12, lineHeight: 1.5 }}>
            Solo funciona con el QR del espacio que reservaste. Si escaneas otro espacio, la activación no se realizará.
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px 0', background: GRAD,
            border: 'none', borderRadius: 12, color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FF,
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

// ── Tarjeta de reserva ────────────────────────────────────────────────────
function ReservaCard({ reserva, onCancelar, cargandoId, onVerInstrucciones }) {
  const est  = EST[reserva.estado] || EST.ACTIVA
  const Icon = est.Icon
  const isPendiente = reserva.estado === 'PENDIENTE_ACTIVACION'
  const isActiva    = reserva.estado === 'ACTIVA'

  return (
    <Card style={{ marginBottom: 14, fontFamily: FF }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'rgba(61,232,200,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ParkingSquare size={20} color="#3de8c8" />
          </div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Espacio {reserva.codigoEspacio}</div>
            <div style={{ color: C.muted, fontSize: 12 }}>{reserva.zonaNombre} · {reserva.sedeNombre}</div>
          </div>
        </div>
        <Badge style={{ background: `${est.color}22`, color: est.color, borderColor: `${est.color}44` }}>
          <Icon size={11} /> {est.label}
        </Badge>
      </div>

      {/* Fecha y hora */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, color: C.muted, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} /> {fmtFecha(reserva.fechaReserva)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} /> {fmtHora(reserva.fechaInicio)} – {fmtHora(reserva.fechaFin)}
        </div>
      </div>

      {/* Check-in / Check-out */}
      {(reserva.checkInTime || reserva.checkOutTime) && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 12,
          background: C.bg, borderRadius: 10, padding: '8px 12px', fontSize: 12,
        }}>
          {reserva.checkInTime && <div style={{ color: '#3de8c8' }}>✓ Entrada: {fmtHora(reserva.checkInTime)}</div>}
          {reserva.checkOutTime && <div style={{ color: C.muted }}>✓ Salida: {fmtHora(reserva.checkOutTime)}</div>}
        </div>
      )}

      {/* Banner pendiente */}
      {isPendiente && (
        <div style={{
          background: 'rgba(61,232,200,0.06)', border: '1px solid rgba(61,232,200,0.18)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <ScanLine size={16} color="#3de8c8" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#3de8c8', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              Pendiente de activación
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>
              Ve al espacio y escanea el QR físico para activarla.
            </div>
          </div>
          <button
            onClick={() => onVerInstrucciones(reserva)}
            style={{
              background: 'rgba(61,232,200,0.12)', border: '1px solid rgba(61,232,200,0.3)',
              borderRadius: 8, padding: '6px 12px', color: '#3de8c8',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FF,
            }}
          >
            ¿Cómo?
          </button>
        </div>
      )}

      {/* Banner activa */}
      {isActiva && (
        <div style={{
          background: 'rgba(61,232,200,0.06)', border: '1px solid rgba(61,232,200,0.25)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <CheckCircle size={16} color="#3de8c8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ color: '#3de8c8', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              En uso — reserva activa
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>
              Escanea el QR del espacio al salir para completarla.
            </div>
          </div>
        </div>
      )}

      {/* Cancelar solo para PENDIENTE */}
      {isPendiente && (
        <button
          disabled={cargandoId === reserva.id}
          onClick={() => onCancelar(reserva.id)}
          style={{
            width: '100%', padding: '10px 0',
            background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
            borderRadius: 10, color: '#ff4d6d', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: FF, opacity: cargandoId === reserva.id ? 0.5 : 1,
          }}
        >
          {cargandoId === reserva.id ? 'Cancelando…' : '✕  Cancelar reserva'}
        </button>
      )}
    </Card>
  )
}

// ── Página ────────────────────────────────────────────────────────────────
export default function MisReservas() {
  const [reservas,     setReservas]     = useState([])
  const [tab,          setTab]          = useState('activas')
  const [cargando,     setCargando]     = useState(true)
  const [cargandoId,   setCargandoId]   = useState(null)
  const [error,        setError]        = useState('')
  const [modalReserva, setModalReserva] = useState(null)

  useEffect(() => {
    auth.fetchAuth('/api/reservas/mis-reservas')
      .then(r => r.json())
      .then(data => { setReservas(Array.isArray(data) ? data : []); setCargando(false) })
      .catch(() => { setError('No se pudieron cargar las reservas.'); setCargando(false) })
  }, [])

  const activas   = reservas.filter(r => r.estado === 'PENDIENTE_ACTIVACION' || r.estado === 'ACTIVA')
  const historial = reservas.filter(r => ['COMPLETADA', 'CANCELADA', 'NO_SHOW'].includes(r.estado))

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    setCargandoId(id)
    try {
      const res = await auth.fetchAuth(`/api/reservas/${id}/cancelar`, { method: 'PATCH' })
      if (res.ok) {
        const updated = await res.json()
        setReservas(prev => prev.map(r => r.id === id ? updated : r))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.mensaje || 'No se pudo cancelar.')
      }
    } catch {
      alert('Error de conexión.')
    } finally {
      setCargandoId(null)
    }
  }

  const lista = tab === 'activas' ? activas : historial

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 32px', fontFamily: FF }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 24 }}>
        <GradText>Mis reservas</GradText>
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24,
        background: C.surface, borderRadius: 50, padding: 4, width: 'fit-content',
      }}>
        {[
          { key: 'activas',   label: `Activas (${activas.length})` },
          { key: 'historial', label: `Historial (${historial.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', borderRadius: 50, border: 'none',
            background: tab === t.key ? GRAD : 'transparent',
            color: tab === t.key ? '#fff' : C.muted,
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FF,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info banner nuevo flujo */}
      {tab === 'activas' && activas.length > 0 && (
        <div style={{
          background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <Info size={16} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>¿Cómo activar tu reserva?</span>
            {' '}Ve a tu espacio físico y escanea el código QR que está pegado en él.
            No necesitas mostrar nada desde la app — el QR está en el espacio.
          </div>
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Cargando…</div>
      ) : error ? (
        <div style={{ color: '#ff4d6d', textAlign: 'center', padding: 40 }}>{error}</div>
      ) : lista.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <ParkingSquare size={36} color={C.muted} style={{ margin: '0 auto 12px' }} />
          <div style={{ color: C.muted, fontSize: 14 }}>
            {tab === 'activas' ? 'No tienes reservas activas.' : 'Sin historial aún.'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 0 }}>
          {lista.map(r => (
            <ReservaCard
              key={r.id}
              reserva={r}
              onCancelar={handleCancelar}
              cargandoId={cargandoId}
              onVerInstrucciones={setModalReserva}
            />
          ))}
        </div>
      )}

      {modalReserva && (
        <ModalActivacion reserva={modalReserva} onClose={() => setModalReserva(null)} />
      )}
    </div>
  )
}