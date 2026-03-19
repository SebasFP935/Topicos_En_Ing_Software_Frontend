// src/pages/MisReservas.jsx
import { useState, useEffect } from 'react'
import { Clock, Calendar, ParkingSquare, CheckCircle, AlertTriangle, X, Info, ScanLine } from 'lucide-react'
import { C, GRAD, MAIN_TITLE_SIZE } from '../tokens'
import { Card }         from '../components/ui/Card'
import { Badge }        from '../components/ui/Badge'
import { SectionLabel } from '../components/ui/SectionLabel'
import { auth }         from '../utils/auth'

const FF = 'var(--ff-apple)'

const fmtHora  = dt => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''
const fmtFecha = d  => d  ? new Date(d + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

const EST = {
  PENDIENTE_ACTIVACION: { label: 'Pendiente',  color: '#ff7a9a', Icon: Clock         },
  ACTIVA:               { label: 'Activa',      color: '#ff4d6d', Icon: CheckCircle   },
  COMPLETADA:           { label: 'Completada',  color: '#8d6bff', Icon: CheckCircle   },
  CANCELADA:            { label: 'Cancelada',   color: '#ff4d6d', Icon: X             },
  NO_SHOW:              { label: 'No-show',      color: '#ff6b88', Icon: AlertTriangle  },
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
              background: 'rgba(123,165,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScanLine size={20} color="#7ba5ff" />
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
            { num: '1', color: '#7ba5ff', rgb: '123,165,255', titulo: 'Llega a tu espacio', desc: `Dirígete al espacio ${reserva.codigoEspacio} en ${reserva.zonaNombre} dentro de tu horario reservado (puedes llegar hasta 5 min antes).` },
            { num: '2', color: '#ff6b88', rgb: '255,107,136', titulo: 'Escanea el QR del espacio', desc: 'Busca el código QR físico pegado en tu espacio. Ábrelo con la cámara del celular — esto activará tu reserva automáticamente.' },
            { num: '3', color: '#8d6bff', rgb: '141,107,255', titulo: 'Al salir, escanea de nuevo', desc: 'Cuando termines, vuelve a escanear el mismo QR del espacio para marcar tu salida y completar la reserva.' },
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
          background: 'rgba(255,107,136,0.08)', border: '1px solid rgba(255,107,136,0.25)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 20,
        }}>
          <AlertTriangle size={14} color="#ff6b88" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ color: '#ff6b88', fontSize: 12, lineHeight: 1.5 }}>
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
    <Card style={{
      marginBottom: 0,
      fontFamily: FF,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '16px 18px',
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(145deg, rgba(255,77,109,.22), rgba(141,107,255,.18))',
            border: '1px solid rgba(255,77,109,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ParkingSquare size={20} color="#ff7a9a" />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, color: C.muted, fontSize: 13 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '8px 10px',
          background: 'rgba(255,255,255,.02)',
        }}>
          <Calendar size={13} /> <span style={{ whiteSpace: 'nowrap' }}>{fmtFecha(reserva.fechaReserva)}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '8px 10px',
          background: 'rgba(255,255,255,.02)',
        }}>
          <Clock size={13} /> <span style={{ whiteSpace: 'nowrap' }}>{fmtHora(reserva.fechaInicio)} – {fmtHora(reserva.fechaFin)}</span>
        </div>
      </div>

      {/* Check-in / Check-out */}
      {(reserva.checkInTime || reserva.checkOutTime) && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8,
          background: 'linear-gradient(145deg, rgba(255,77,109,.08), rgba(141,107,255,.06))',
          border: '1px solid rgba(255,77,109,.24)', borderRadius: 10, padding: '8px 10px', fontSize: 12,
        }}>
          {reserva.checkInTime && <div style={{ color: '#ff7a9a' }}>✓ Entrada: {fmtHora(reserva.checkInTime)}</div>}
          {reserva.checkOutTime && <div style={{ color: C.muted }}>✓ Salida: {fmtHora(reserva.checkOutTime)}</div>}
        </div>
      )}

      {/* Banner pendiente */}
      {isPendiente && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,77,109,.09), rgba(141,107,255,.07))', border: '1px solid rgba(255,77,109,.28)',
          borderRadius: 10, padding: '10px 12px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <ScanLine size={16} color="#ff7a9a" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ff7a9a', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              Pendiente de activación
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>
              Ve al espacio y escanea el QR físico para activarla.
            </div>
          </div>
          <button
            onClick={() => onVerInstrucciones(reserva)}
            style={{
              background: 'rgba(255,77,109,0.14)', border: '1px solid rgba(255,77,109,0.36)',
              borderRadius: 8, padding: '6px 12px', color: '#ff7a9a',
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
          background: 'linear-gradient(145deg, rgba(255,77,109,.1), rgba(141,107,255,.08))', border: '1px solid rgba(255,77,109,.3)',
          borderRadius: 10, padding: '10px 12px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <CheckCircle size={16} color="#ff7a9a" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ color: '#ff7a9a', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
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
            width: '100%', padding: '10px 0', marginTop: 'auto',
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
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px clamp(12px, 2.4vw, 26px) 34px', fontFamily: FF }}>
      <div style={{
        borderRadius: 26,
        border: `1px solid ${C.border}`,
        background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 45%, rgba(255,255,255,.01)), #07090d',
        padding: 'clamp(18px, 2vw, 28px)',
        boxShadow: '0 20px 48px rgba(0,0,0,.35)',
      }}>
      <h1 style={{ fontSize: MAIN_TITLE_SIZE, fontWeight: 830, color: C.text, marginBottom: 20, letterSpacing: '-.03em' }}>Mis reservas</h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
        background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`, borderRadius: 50, padding: 4, width: 'fit-content',
      }}>
        {[
          { key: 'activas',   label: `Activas (${activas.length})` },
          { key: 'historial', label: `Historial (${historial.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', borderRadius: 50, border: 'none',
            background: tab === t.key ? GRAD : 'transparent',
            color: tab === t.key ? '#fff' : C.muted,
            fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FF,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info banner nuevo flujo */}
      {tab === 'activas' && activas.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,77,109,.11), rgba(141,107,255,.08))', border: '1px solid rgba(255,77,109,.3)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 18,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <Info size={16} color="#ff7a9a" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
            <span style={{ color: '#ff7a9a', fontWeight: 700 }}>¿Cómo activar tu reserva?</span>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}>
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
    </div>
  )
}


