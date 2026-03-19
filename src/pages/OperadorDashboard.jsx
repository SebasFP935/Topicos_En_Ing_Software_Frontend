// src/pages/OperadorDashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle, Map, RefreshCw,
  AlertTriangle, Calendar, ScanLine, X,
} from 'lucide-react'
import { C, GRAD, MAIN_TITLE_SIZE } from '../tokens'
import { Card } from '../components/ui/Card'
import { auth } from '../utils/auth'

const FF = 'var(--ff-apple)'

const fmtH = dt => dt ? new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—'

const ESTADO = {
  PENDIENTE_ACTIVACION: { label: 'Pendiente',  color: '#ff6b88' },
  ACTIVA:               { label: 'Activa',      color: '#ff4d6d' },
  COMPLETADA:           { label: 'Completada',  color: '#7ba5ff' },
  CANCELADA:            { label: 'Cancelada',   color: '#ff4d6d' },
  NO_SHOW:              { label: 'No-show',      color: '#ff6b88' },
}

// ── KPI Card ────────────────────────────────────────────────────────────────
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

// ── Badge estado ────────────────────────────────────────────────────────────
function EstBadge({ estado }) {
  const m = ESTADO[estado] || { label: estado, color: C.muted }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: m.color + '18', border: `1px solid ${m.color}30`, borderRadius: 100, padding: '3px 10px', fontFamily: FF, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  )
}

export default function OperadorDashboard() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [manualQr, setManualQr] = useState('')
  const [manualMsg,setManualMsg]= useState(null)   // { tipo, msg }
  const [procLoading, setProcLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // reservaId en proceso

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auth.fetchAuth('/api/reservas/hoy')
      setReservas(res.ok ? await res.json() : [])
    } catch { setReservas([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Acción por botón en fila ──────────────────────────────────────────────
  const doAccion = async (reserva, accion) => {
    setActionLoading(reserva.id)
    try {
      const url = `/api/reservas/${accion}/${reserva.codigoQr}`
      const res = await auth.fetchAuth(url, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.mensaje || `Error en ${accion}`)
      }
      await cargar()
    } catch (e) {
      alert(e.message)
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

    // Intenta checkin, si ya está activo intenta checkout
    const tryAction = async (accion) => {
      const res = await auth.fetchAuth(`/api/reservas/${accion}/${code}`, { method: 'PATCH' })
      const d   = await res.json().catch(() => ({}))
      return { ok: res.ok, data: d, status: res.status }
    }

    try {
      let r = await tryAction('checkin')
      if (r.ok) {
        setManualMsg({ tipo: 'success', msg: `✓ Check-in registrado — Espacio ${r.data.codigoEspacio}` })
        setManualQr('')
        cargar()
      } else if (r.status === 422 || r.status === 400) {
        // Probablemente ya hizo check-in, intentar checkout
        let r2 = await tryAction('checkout')
        if (r2.ok) {
          setManualMsg({ tipo: 'success', msg: `✓ Check-out registrado — Espacio ${r2.data.codigoEspacio}` })
          setManualQr('')
          cargar()
        } else {
          setManualMsg({ tipo: 'error', msg: r.data.mensaje || r2.data.mensaje || 'No se pudo procesar el código.' })
        }
      } else {
        setManualMsg({ tipo: 'error', msg: r.data.mensaje || 'QR inválido o reserva no encontrada.' })
      }
    } catch {
      setManualMsg({ tipo: 'error', msg: 'Error de conexión.' })
    } finally {
      setProcLoading(false)
    }
  }

  const pendientes  = reservas.filter(r => r.estado === 'PENDIENTE_ACTIVACION').length
  const activas     = reservas.filter(r => r.estado === 'ACTIVA').length
  const completadas = reservas.filter(r => r.estado === 'COMPLETADA').length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 72px', fontFamily: FF }}>
      <div style={{ borderRadius: 28, border: `1px solid ${C.border}`, background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 45%, rgba(255,255,255,.01)), #07090d', padding: '28px 22px 30px', boxShadow: '0 22px 52px rgba(0,0,0,.36)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: MAIN_TITLE_SIZE, fontWeight: 800, color: C.text, letterSpacing: '-.03em' }}>Panel Operador</h1>
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
        <KpiCard label="Pendientes"  val={pendientes}  color="#ff6b88" Icon={Clock}         loading={loading} />
        <KpiCard label="Activas"     val={activas}     color="#ff4d6d" Icon={CheckCircle}   loading={loading} />
        <KpiCard label="Completadas" val={completadas}  color="#7ba5ff" Icon={CheckCircle}   loading={loading} />
        <KpiCard label="Total hoy"   val={reservas.length} color="#8d6bff" Icon={Calendar}  loading={loading} />
      </div>

      {/* Procesar QR manualmente */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ScanLine size={16} color={C.accent} />
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>Procesar código QR manualmente</p>
        </div>
        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, marginBottom: 14 }}>
          Introduce el código QR de la <strong style={{ color: C.text }}>reserva</strong> del usuario para registrar su entrada o salida.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={manualQr}
            onChange={e => { setManualQr(e.target.value); setManualMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && procesarManual()}
            placeholder="Pega o escribe el código QR de la reserva..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: C.s2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: FF, outline: 'none' }}
          />
          <button
            onClick={procesarManual}
            disabled={!manualQr.trim() || procLoading}
            style={{ padding: '10px 22px', borderRadius: 10, background: manualQr.trim() ? GRAD : C.border, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: manualQr.trim() ? 'pointer' : 'default', fontFamily: FF, whiteSpace: 'nowrap' }}
          >
            {procLoading ? 'Procesando…' : 'Procesar'}
          </button>
        </div>
        {manualMsg && (
          <div style={{ marginTop: 10, padding: '9px 14px', borderRadius: 8, background: manualMsg.tipo === 'success' ? '#ff4d6d14' : '#ff4d6d14', border: `1px solid ${manualMsg.tipo === 'success' ? '#ff4d6d30' : '#ff4d6d30'}`, color: manualMsg.tipo === 'success' ? '#ff4d6d' : '#ff4d6d', fontSize: 13, fontFamily: FF }}>
            {manualMsg.msg}
          </div>
        )}
      </div>

      {/* Tabla reservas */}
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, fontFamily: FF }}>
        Reservas de hoy ({loading ? '…' : reservas.length})
      </p>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: C.muted }}>Cargando reservas…</div>
        ) : reservas.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <Calendar size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ color: C.muted, fontSize: 14 }}>No hay reservas para hoy</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Usuario', 'Espacio / Zona', 'Horario', 'Check-in', 'Check-out', 'Estado', 'Acción'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textAlign: 'left', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: FF, whiteSpace: 'nowrap' }}>{h}</th>
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
                        ? <span style={{ fontSize: 12, color: '#ff4d6d', fontWeight: 600, fontFamily: FF }}>✓ {fmtH(r.checkInTime)}</span>
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {r.checkOutTime
                        ? <span style={{ fontSize: 12, color: '#7ba5ff', fontWeight: 600, fontFamily: FF }}>✓ {fmtH(r.checkOutTime)}</span>
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <EstBadge estado={r.estado} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.estado === 'PENDIENTE_ACTIVACION' && (
                          <button
                            disabled={actionLoading === r.id}
                            onClick={() => doAccion(r, 'checkin')}
                            style={{ padding: '5px 12px', borderRadius: 7, background: '#ff4d6d14', border: '1px solid #ff4d6d30', color: '#ff4d6d', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF, opacity: actionLoading === r.id ? 0.5 : 1 }}
                          >
                            {actionLoading === r.id ? '…' : 'Check-in'}
                          </button>
                        )}
                        {r.estado === 'ACTIVA' && (
                          <button
                            disabled={actionLoading === r.id}
                            onClick={() => doAccion(r, 'checkout')}
                            style={{ padding: '5px 12px', borderRadius: 7, background: '#8d6bff14', border: '1px solid #8d6bff30', color: '#8d6bff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF, opacity: actionLoading === r.id ? 0.5 : 1 }}
                          >
                            {actionLoading === r.id ? '…' : 'Check-out'}
                          </button>
                        )}
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
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#7ba5ff0a', border: '1px solid #7ba5ff20', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={14} color={C.accent} style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>
          El código QR de la reserva está en el correo/ticket del usuario. Para el check-in/out automático, el usuario puede escanear directamente el <strong style={{ color: C.text }}>QR físico del slot</strong> de parqueo con su cámara.
        </p>
      </div>
      </div>
    </div>
  )
}

