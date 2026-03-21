// src/pages/OperadorDashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle, Map, RefreshCw,
  AlertTriangle, Calendar, ScanLine, X, QrCode,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const fmtH = dt => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—'

const ESTADO = {
  PENDIENTE_ACTIVACION: { label: 'Pendiente',  color: '#f59e0b' },
  ACTIVA:               { label: 'Activa',      color: '#3de8c8' },
  COMPLETADA:           { label: 'Completada',  color: '#5b7eff' },
  CANCELADA:            { label: 'Cancelada',   color: '#0068b7' },
  NO_SHOW:              { label: 'No-show',     color: '#ffaa00' },
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, val, color, Icon, loading }) {
  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: FF, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 34, fontWeight: 800, color, fontFamily: FF }}>{loading ? '…' : val}</p>
    </Card>
  )
}

// ── Badge estado ──────────────────────────────────────────────────────────────
function EstBadge({ estado }) {
  const m = ESTADO[estado] || { label: estado, color: C.muted }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: m.color + '18', border: `1px solid ${m.color}30`, borderRadius: 100, padding: '3px 10px', fontFamily: FF, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  )
}

// ── Modal QR ──────────────────────────────────────────────────────────────────
function QrModal({ reserva, onClose }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    if (!reserva?.espacioId) { setError(true); return }
    let url = null
    auth.fetchAuth(`/api/espacios/${reserva.espacioId}/qr`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.blob()
      })
      .then(blob => {
        url = URL.createObjectURL(blob)
        setImgSrc(url)
      })
      .catch(() => setError(true))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [reserva])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: 28, maxWidth: 360, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FF }}>
              QR Espacio {reserva.codigoEspacio}
            </p>
            <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, marginTop: 2 }}>
              {reserva.zonaNombre} · {reserva.usuarioNombre}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        {/* QR Image */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 220, marginBottom: 16,
        }}>
          {!imgSrc && !error && (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: `3px solid #e5e7eb`, borderTopColor: '#111',
              animation: 'spin .8s linear infinite',
            }} />
          )}
          {error && (
            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', fontFamily: FF }}>
              No se pudo cargar el QR.<br/>Reinicia el backend para generarlo.
            </p>
          )}
          {imgSrc && (
            <img src={imgSrc} alt="QR" style={{ width: 188, height: 188, display: 'block' }} />
          )}
        </div>

        {/* Instrucción */}
        <div style={{
          background: 'rgba(61,232,200,0.07)', border: '1px solid rgba(61,232,200,0.2)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>
            Muestra este QR al usuario para que lo escanee con su cámara.
            Funciona para <strong style={{ color: '#3de8c8' }}>check-in</strong> y <strong style={{ color: '#a78bfa' }}>check-out</strong>.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px 0', background: GRAD,
            border: 'none', borderRadius: 10, color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FF,
          }}
        >
          Cerrar
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function OperadorDashboard() {
  const navigate = useNavigate()
  const [reservas,     setReservas]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [manualQr,     setManualQr]     = useState('')
  const [manualMsg,    setManualMsg]    = useState(null)
  const [procLoading,  setProcLoading]  = useState(false)
  const [qrModal,      setQrModal]      = useState(null) // reserva seleccionada

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auth.fetchAuth('/api/reservas/hoy')
      setReservas(res.ok ? await auth.readJson(res, []) : [])
    } catch { setReservas([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Acción por botón en fila ──────────────────────────────────────────────
  const doAccion = async (reserva) => {
    setActionLoading(reserva.id)
    try {
      if (!reserva.codigoQrFisico) throw new Error('El espacio no tiene QR fisico configurado.')
      const res = await auth.fetchAuth(`/api/reservas/escanear/${encodeURIComponent(reserva.codigoQrFisico)}`)
      if (!res.ok) {
        const d = await auth.readJson(res, {})
        throw new Error(auth.message(d?.mensaje, 'No se pudo procesar el QR fisico.'))
      }
      await cargar()
    } catch (e) {
      alert(auth.message(e?.message, 'No se pudo procesar el QR fisico.'))
    } finally {
      setActionLoading(null)
    }
  }

  // ── Procesar código manual ────────────────────────────────────────────────
  const procesarManual = async () => {
    const code = manualQr.trim()
    if (!code) return
    setProcLoading(true)
    setManualMsg(null)
    try {
      const res  = await auth.fetchAuth(`/api/reservas/escanear/${encodeURIComponent(code)}`)
      const data = await auth.readJson(res, {})
      if (res.ok) {
        const accion = data?.accion === 'CHECK_OUT' ? 'Check-out' : 'Check-in'
        setManualMsg({ tipo: 'success', msg: `OK ${accion} registrado - Espacio ${data.codigoEspacio}` })
        setManualQr('')
        cargar()
      } else {
        setManualMsg({ tipo: 'error', msg: auth.message(data?.mensaje, 'No se pudo procesar el QR fisico.') })
      }
    } catch {
      setManualMsg({ tipo: 'error', msg: 'Error de conexion.' })
    } finally {
      setProcLoading(false)
    }
  }

  const pendientes  = reservas.filter(r => r.estado === 'PENDIENTE_ACTIVACION').length
  const activas     = reservas.filter(r => r.estado === 'ACTIVA').length
  const completadas = reservas.filter(r => r.estado === 'COMPLETADA').length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 72px', fontFamily: FF }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><GradText>Panel Operador</GradText></h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/operador/zonas')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: GRAD, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}
          >
            <Map size={15} /> Gestionar zonas
          </button>
          <button
            onClick={cargar}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: FF }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Pendientes"  val={pendientes}      color="#f59e0b" Icon={Clock}       loading={loading} />
        <KpiCard label="Activas"     val={activas}         color="#3de8c8" Icon={CheckCircle} loading={loading} />
        <KpiCard label="Completadas" val={completadas}     color="#5b7eff" Icon={CheckCircle} loading={loading} />
        <KpiCard label="Total hoy"   val={reservas.length} color="#a259ff" Icon={Calendar}    loading={loading} />
      </div>

      {/* Procesar QR manualmente */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ScanLine size={16} color={C.accent} />
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>Procesar codigo QR manualmente</p>
        </div>
        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, marginBottom: 14 }}>
          Pega el <strong style={{ color: C.text }}>UUID del QR físico</strong> del espacio para registrar entrada o salida.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={manualQr}
            onChange={e => { setManualQr(e.target.value); setManualMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && procesarManual()}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: C.s2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: FF, outline: 'none' }}
          />
          <button
            onClick={procesarManual}
            disabled={!manualQr.trim() || procLoading}
            style={{ padding: '10px 22px', borderRadius: 10, background: manualQr.trim() ? GRAD : C.border, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: manualQr.trim() ? 'pointer' : 'default', fontFamily: FF, whiteSpace: 'nowrap' }}
          >
            {procLoading ? '…' : 'Procesar'}
          </button>
        </div>
        {manualMsg && (
          <p style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: manualMsg.tipo === 'success' ? '#3de8c8' : '#ff4d6d', fontFamily: FF }}>
            {manualMsg.msg}
          </p>
        )}
      </div>

      {/* Tabla de reservas */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>
            RESERVAS DE HOY ({loading ? '…' : reservas.length})
          </p>
        </div>

        {loading ? (
          <p style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: FF }}>Cargando…</p>
        ) : reservas.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: FF }}>No hay reservas para hoy.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.s2 }}>
                  {['USUARIO', 'ESPACIO / ZONA', 'HORARIO', 'CHECK-IN', 'CHECK-OUT', 'ESTADO', 'ACCIÓN'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: FF, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: i < reservas.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.s2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{r.usuarioNombre}</p>
                      <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{r.usuarioEmail}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FF }}>{r.codigoEspacio}</p>
                      <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{r.zonaNombre} · {r.sedeNombre}</p>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color={C.muted} />
                        <span style={{ fontSize: 13, color: C.text, fontFamily: FF }}>{fmtH(r.fechaInicio)} – {fmtH(r.fechaFin)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {r.checkInTime
                        ? <span style={{ fontSize: 12, color: '#3de8c8', fontWeight: 600, fontFamily: FF }}>✓ {fmtH(r.checkInTime)}</span>
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {r.checkOutTime
                        ? <span style={{ fontSize: 12, color: '#5b7eff', fontWeight: 600, fontFamily: FF }}>✓ {fmtH(r.checkOutTime)}</span>
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <EstBadge estado={r.estado} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* Botón Ver QR */}
                        <button
                          onClick={() => setQrModal(r)}
                          title="Ver QR del espacio"
                          style={{ padding: '5px 10px', borderRadius: 7, background: '#5b7eff14', border: '1px solid #5b7eff30', color: '#5b7eff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <QrCode size={12} /> QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aviso QR */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#5b7eff0a', border: '1px solid #5b7eff20', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={14} color={C.accent} style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>
          Usa el botón <strong style={{ color: '#5b7eff' }}>QR</strong> en cada fila para mostrar el código al usuario y que lo escanee desde la pantalla.
          El check-in/check-out automático ocurre al escanear con la cámara del celular.
        </p>
      </div>

      {/* Modal QR */}
      {qrModal && <QrModal reserva={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  )
}