// Página PÚBLICA — se abre cuando el usuario escanea el QR con la cámara
// Endpoint: GET /api/reservas/escanear/{token}  (sin autenticación)

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, ParkingSquare, LogIn, LogOut } from 'lucide-react'
import { C, GRAD } from '../tokens'

const FF = "'Plus Jakarta Sans', sans-serif"

const fmtHora = iso => iso ? new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''

export default function Escanear() {
  const { token } = useParams()
  const [estado,   setEstado]   = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [resultado, setResultado] = useState(null)
  const [mensaje,  setMensaje]  = useState('')

  useEffect(() => {
    if (!token) { setEstado('error'); setMensaje('Token inválido.'); return }

    fetch(`/api/reservas/escanear/${token}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          setEstado('error')
          setMensaje(data.mensaje || 'No se pudo procesar el QR.')
        } else {
          setEstado('ok')
          setResultado(data)
        }
      })
      .catch(() => {
        setEstado('error')
        setMensaje('No se pudo conectar con el servidor.')
      })
  }, [token])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: C.muted, fontFamily: FF, fontSize: 14 }}>Procesando QR...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ParkingSquare size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: FF, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NoParking
            </span>
          </div>

          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ff4d6d18', border: '2px solid #ff4d6d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <XCircle size={40} color="#ff4d6d" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 10 }}>
            QR inválido
          </h2>
          <p style={{ fontSize: 14, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>
            {mensaje}
          </p>
        </div>
      </div>
    )
  }

  // ── Éxito ────────────────────────────────────────────────────────────────
  const esEntrada  = resultado?.accion === 'CHECK_IN'
  const color      = esEntrada ? '#3de8c8' : '#5b7eff'
  const IconAccion = esEntrada ? LogIn : LogOut

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 380, width: '100%' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ParkingSquare size={22} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: FF, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NoParking
          </span>
        </div>

        {/* Card resultado */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, textAlign: 'center' }}>

          {/* Ícono acción */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: color + '18', border: `2px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <IconAccion size={44} color={color} />
          </div>

          {/* Acción */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: color + '14', border: `1px solid ${color}30`,
            borderRadius: 100, padding: '4px 14px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: FF, letterSpacing: 1, textTransform: 'uppercase' }}>
              {esEntrada ? 'Entrada registrada' : 'Salida registrada'}
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 8 }}>
            {resultado.mensaje}
          </h2>

          {/* Detalles */}
          <div style={{ background: C.s2, borderRadius: 12, padding: '14px 18px', marginTop: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Espacio</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>{resultado.codigoEspacio}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Zona</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{resultado.zonaNombre}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Estado espacio</span>
              <span style={{
                fontSize: 12, fontWeight: 700, borderRadius: 100, padding: '3px 10px',
                color: resultado.estadoEspacio === 'OCUPADO' ? '#ffaa00' : '#3de8c8',
                background: resultado.estadoEspacio === 'OCUPADO' ? '#ffaa0014' : '#3de8c814',
                border: `1px solid ${resultado.estadoEspacio === 'OCUPADO' ? '#ffaa0030' : '#3de8c830'}`,
                fontFamily: FF,
              }}>
                {resultado.estadoEspacio}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Hora</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color={C.muted} />
                {fmtHora(resultado.timestamp)}
              </span>
            </div>
          </div>

          <p style={{ fontSize: 11, color: C.muted, fontFamily: FF, marginTop: 18 }}>
            {esEntrada
              ? 'Tu espacio está reservado. Recuerda escanear al salir.'
              : 'Gracias por usar NoParking. ¡Hasta la próxima!'}
          </p>
        </div>
      </div>
    </div>
  )
}