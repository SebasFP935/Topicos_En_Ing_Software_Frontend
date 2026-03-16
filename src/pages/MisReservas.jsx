// src/pages/MisReservas.jsx
import { useState, useEffect, useRef } from 'react'
import { Clock, Calendar, ParkingSquare, CheckCircle, AlertTriangle, X, QrCode, Download } from 'lucide-react'
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

// ── Componente QR Image ────────────────────────────────────────────────────
// Genera QR usando la API pública de QuickChart (sin dependencias npm)
function QRImage({ value, size = 180 }) {
  const url = `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size}&dark=3de8c8&light=0d0e1f&margin=1`
  return (
    <img
      src={url}
      alt="Código QR"
      width={size}
      height={size}
      style={{ borderRadius: 12, display: 'block' }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

// ── Modal QR ───────────────────────────────────────────────────────────────
function ModalQR({ reserva, onClose }) {
  const qrValue = reserva.qrUrl || reserva.qrToken || reserva.codigoQr
  const size = 260

  const handleDownload = () => {
    const url = `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=400&dark=3de8c8&light=0d0e1f&margin=2`
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-reserva-${reserva.codigoEspacio}.png`
    a.target = '_blank'
    a.click()
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'#00000090', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius: 20, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}
      >
        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 4 }}>
          Código QR de acceso
        </p>
        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, marginBottom: 20 }}>
          Espacio <strong style={{ color: C.teal }}>{reserva.codigoEspacio}</strong> · {fmtFecha(reserva.fechaReserva)}
        </p>

        {/* QR Image */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 20 }}>
          <div style={{ padding: 16, background: '#0d0e1f', borderRadius: 16, border:`2px solid ${C.border}` }}>
            <QRImage value={qrValue} size={size} />
          </div>
        </div>

        {/* Horario */}
        <div style={{ background: C.s2, borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Horario</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>
              {fmtHora(reserva.fechaInicio)} – {fmtHora(reserva.fechaFin)}
            </span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Zona</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>
              {reserva.zonaNombre}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, fontFamily: FF, marginBottom: 20 }}>
          Presenta este QR al ingresar y al salir del parqueo
        </p>

        <div style={{ display:'flex', gap: 8 }}>
          <button
            onClick={handleDownload}
            style={{ flex:1, padding:'10px', borderRadius:10, background: C.s2, border:`1px solid ${C.border}`, color: C.muted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FF, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
          >
            <Download size={14} /> Guardar
          </button>
          <button
            onClick={onClose}
            style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: GRAD, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FF }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta de reserva ─────────────────────────────────────────────────────
function ReservaCard({ r, onCancelar, canceling, onVerQR }) {
  const E     = EST[r.estado] || EST.ACTIVA
  const Icon  = E.Icon
  const activa = r.estado === 'ACTIVA'
  const qrValue = r.qrUrl || r.qrToken || r.codigoQr

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

      {/* Check-in info si ya hizo */}
      {r.checkInTime && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8,
          background: '#3de8c810', border: '1px solid #3de8c825',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={13} color='#3de8c8' />
          <span style={{ fontSize: 11, color: '#3de8c8', fontFamily: FF, fontWeight: 600 }}>
            Check-in: {fmtHora(r.checkInTime)}
          </span>
          {r.checkOutTime && (
            <span style={{ fontSize: 11, color: C.muted, fontFamily: FF, marginLeft: 'auto' }}>
              Salida: {fmtHora(r.checkOutTime)}
            </span>
          )}
        </div>
      )}

      {/* QR preview + botón ver QR completo */}
      {activa && qrValue && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: '#5b7eff08', border: '1px solid #5b7eff20',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Mini QR preview */}
          <div style={{ flexShrink: 0 }}>
            <QRImage value={qrValue} size={52} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FF, marginBottom: 2 }}>
              Tu código de acceso
            </p>
            <p style={{ fontSize: 10, color: C.muted, fontFamily: FF }}>
              Presenta al ingresar y salir
            </p>
          </div>
          <button
            onClick={() => onVerQR(r)}
            style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 8,
              background: GRAD, border: 'none', color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <QrCode size={12} /> Ver QR
          </button>
        </div>
      )}

      {activa && (
        <button
          onClick={() => onCancelar(r.id)}
          disabled={canceling === r.id}
          style={{
            width: '100%', marginTop: 10,
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

// ── Página principal ───────────────────────────────────────────────────────
export default function MisReservas() {
  const [tab,       setTab]       = useState('activas')
  const [reservas,  setReservas]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [canceling, setCanceling] = useState(null)
  const [qrModal,   setQrModal]   = useState(null) // reserva para mostrar QR

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
      const res = await auth.fetchAuth(`/api/reservas/${id}/cancelar`, { method: 'PATCH' })
      if (res.ok) {
        setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'CANCELADA' } : r))
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
              <ReservaCard key={r.id} r={r} onCancelar={cancelar} canceling={canceling} onVerQR={setQrModal} />
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
                {/* check-in/out en historial */}
                {(r.checkInTime || r.checkOutTime) && (
                  <div style={{ display:'flex', gap:16, marginTop:8 }}>
                    {r.checkInTime && <span style={{ fontSize:11, color: C.muted, fontFamily: FF }}>Entrada: {fmtHora(r.checkInTime)}</span>}
                    {r.checkOutTime && <span style={{ fontSize:11, color: C.muted, fontFamily: FF }}>Salida: {fmtHora(r.checkOutTime)}</span>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      )}

      {/* Modal QR */}
      {qrModal && <ModalQR reserva={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  )
}