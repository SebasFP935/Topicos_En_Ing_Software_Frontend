// src/pages/Escanear.jsx
// Se abre cuando el usuario escanea el QR fisico del espacio.
// Endpoint: GET /api/reservas/escanear/{codigoQrFisico} (requiere autenticacion)
// El codigoQrFisico es el UUID fijo del Espacio, no de la reserva.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { XCircle, Clock, ParkingSquare, LogIn, LogOut, AlertTriangle } from 'lucide-react'
import { C } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"
const fmtHora = iso => iso ? new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''

export default function Escanear() {
  const { codigoQrFisico } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error' | 'no-auth'
  const [resultado, setResultado] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!codigoQrFisico) {
      setEstado('error')
      setMensaje('Codigo QR invalido.')
      return
    }

    const token = auth.token()
    if (!token) {
      setEstado('no-auth')
      return
    }

    let cancelado = false
    const controller = new AbortController()

    const ejecutarEscaneo = async () => {
      try {
        const res = await auth.fetchAuth(
          `/api/reservas/escanear/${encodeURIComponent(codigoQrFisico)}`,
          { signal: controller.signal }
        )
        if (cancelado) return

        const data = await res.json().catch(() => ({}))
        if (cancelado) return

        if (res.status === 401 || res.status === 403) {
          setEstado('no-auth')
        } else if (!res.ok) {
          setEstado('error')
          setMensaje(data.mensaje || 'No se pudo procesar el escaneo.')
        } else {
          setEstado('ok')
          setResultado(data)
        }
      } catch {
        if (cancelado || controller.signal.aborted) return
        setEstado('error')
        setMensaje('Error de conexion. Intenta de nuevo.')
      }
    }

    // En StrictMode (dev), React monta/desmonta una vez extra.
    // Este defer evita una doble llamada real al backend.
    const timeoutId = window.setTimeout(ejecutarEscaneo, 0)

    return () => {
      cancelado = true
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [codigoQrFisico])

  if (estado === 'no-auth') {
    return (
      <Pantalla>
        <Icono color="#f59e0b" bg="rgba(245,158,11,0.12)">
          <AlertTriangle size={36} color="#f59e0b" />
        </Icono>
        <h2 style={h2}>Debes iniciar sesion</h2>
        <p style={sub}>Para activar tu reserva, primero inicia sesion en la app.</p>
        <button
          onClick={() => navigate('/login', { state: { redirect: `/escanear/${codigoQrFisico}` } })}
          style={btnPrimary}
        >
          Iniciar sesion
        </button>
      </Pantalla>
    )
  }

  if (estado === 'cargando') {
    return (
      <Pantalla>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `3px solid ${C.border}`,
          borderTopColor: '#3de8c8',
          margin: '0 auto 20px',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: C.muted, fontSize: 14 }}>Procesando escaneo...</p>
      </Pantalla>
    )
  }

  if (estado === 'error') {
    return (
      <Pantalla>
        <Icono color="#ff4d6d" bg="rgba(255,77,109,0.12)">
          <XCircle size={36} color="#ff4d6d" />
        </Icono>
        <h2 style={{ ...h2, color: '#ff4d6d' }}>No se pudo procesar</h2>
        <p style={sub}>{mensaje}</p>
        <button onClick={() => navigate('/reservas')} style={btnPrimary}>
          Ver mis reservas
        </button>
      </Pantalla>
    )
  }

  const esCheckIn = resultado?.accion === 'CHECK_IN'
  const colorAccion = esCheckIn ? '#3de8c8' : '#a78bfa'
  const bgAccion = esCheckIn ? 'rgba(61,232,200,0.10)' : 'rgba(167,139,250,0.10)'

  return (
    <Pantalla>
      <Icono color={colorAccion} bg={bgAccion}>
        {esCheckIn
          ? <LogIn size={36} color={colorAccion} />
          : <LogOut size={36} color={colorAccion} />}
      </Icono>

      <div style={{
        display: 'inline-block',
        padding: '4px 16px',
        borderRadius: 50,
        background: bgAccion,
        color: colorAccion,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        {esCheckIn ? 'Check-in' : 'Check-out'}
      </div>

      <h2 style={{ ...h2, color: colorAccion }}>
        {esCheckIn ? 'Reserva activada' : 'Hasta pronto'}
      </h2>
      <p style={sub}>{resultado?.mensaje}</p>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '18px 20px',
        margin: '20px 0',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        textAlign: 'left',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: bgAccion,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ParkingSquare size={22} color={colorAccion} />
        </div>
        <div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
            Espacio {resultado?.codigoEspacio}
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>{resultado?.zonaNombre}</div>
        </div>
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: C.muted,
          fontSize: 12,
        }}>
          <Clock size={13} />
          {fmtHora(resultado?.timestamp)}
        </div>
      </div>

      <div style={{
        background: bgAccion,
        border: `1px solid ${colorAccion}33`,
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 24,
        fontSize: 13,
        color: colorAccion,
        lineHeight: 1.5,
      }}>
        {esCheckIn
          ? 'Tu reserva esta activa. Cuando termines, vuelve a escanear el QR del espacio para registrar tu salida.'
          : 'Tu reserva ha sido completada. Gracias por usar el sistema.'}
      </div>

      <button onClick={() => navigate('/reservas')} style={btnPrimary}>
        Ver mis reservas
      </button>
    </Pantalla>
  )
}

function Pantalla({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#06060f',
      padding: 24,
      fontFamily: FF,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        background: '#0d0e1f',
        border: '1px solid #1e2130',
        borderRadius: 24,
        padding: 36,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {children}
      </div>
    </div>
  )
}

function Icono({ children, color, bg }) {
  return (
    <div style={{
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: bg,
      border: `2px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
    }}>
      {children}
    </div>
  )
}

const h2 = { fontSize: 22, fontWeight: 800, color: '#e8eaf6', marginBottom: 8, fontFamily: FF }
const sub = { color: '#6b7099', fontSize: 14, lineHeight: 1.6, marginBottom: 8, fontFamily: FF }
const btnPrimary = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #3de8c8, #5b7eff)',
  border: 'none',
  color: '#fff',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: FF,
}
