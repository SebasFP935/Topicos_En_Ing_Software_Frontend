// src/pages/Reservar.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Calendar, Car, CheckCircle, ChevronRight, AlertTriangle, ParkingSquare, ScanLine, Info, Gauge, Accessibility } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card }         from '../components/ui/Card'
import { Badge }        from '../components/ui/Badge'
import { GradText }     from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button }       from '../components/ui/Button'
import { auth }         from '../utils/auth'
import { trackEvent } from '../utils/analytics'

const FF = "'Plus Jakarta Sans', sans-serif"

const TIPO_VEHICULO_LABEL = {
  AUTO:          { label: 'Auto',         Icon: Car },
  MOTO:          { label: 'Moto',         Icon: Gauge },
  DISCAPACITADO: { label: 'Discapacidad', Icon: Accessibility },
}
const getTipoVehiculoIcon = (tipoVehiculo) => TIPO_VEHICULO_LABEL[tipoVehiculo]?.Icon || Car


// ── Mapa SVG ──────────────────────────────────────────────────────────────
// idsDisponibles: Set<number> con IDs libres para el horario elegido, o null si aún no se consultó
// ── REEMPLAZAR el componente MapaReserva en src/pages/Reservar.jsx ──────────
// Busca la función "function MapaReserva(...)" y reemplázala COMPLETA por esto:

function MapaReserva({ zona, espacios, onSelect, idsDisponibles }) {
  const W     = zona?.mapaAncho || 800
  const H     = zona?.mapaAlto  || 500
  const plano = zona?.plano     || []

  // Determina el estado visual del espacio considerando disponibilidad por horario
  const estadoVisual = (e) => {
    if (e.estado === 'BLOQUEADO')     return 'BLOQUEADO'
    if (e.estado === 'MANTENIMIENTO') return 'MANTENIMIENTO'
    if (idsDisponibles !== null) {
      if (e.estado === 'OCUPADO') return 'OCUPADO'
      if (!idsDisponibles.has(e.id)) return 'RESERVADO'
      return 'DISPONIBLE'
    }
    return e.estado
  }

  const colorPorEstado = {
    DISPONIBLE:    C.accent,
    RESERVADO:     C.warn,
    OCUPADO:       '#f97316',
    BLOQUEADO:     C.danger,
    MANTENIMIENTO: C.danger,
  }

  return (
    <div style={{
      width: '100%', overflowX: 'auto', borderRadius: 14,
      border: `1px solid ${C.border}`, background: C.surface,
    }}>
      {/* Indicador de carga de disponibilidad */}
      {idsDisponibles === null && (
        <div style={{
          padding: '8px 14px', background: C.accent + '14',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            border: `2px solid ${C.border}`, borderTopColor: C.accent,
            animation: 'spin .8s linear infinite', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
            Consultando disponibilidad para el horario seleccionado...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* SVG del mapa — usa las mismas dimensiones y coordenadas que el editor */}
      {/* Wrapper con aspect ratio fijo + tamaño mínimo garantizado */}
      <div style={{ position: 'relative', width: '100%', minHeight: 520 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block',
          }}
        >
        {/* Fondo */}
        <rect x={0} y={0} width={W} height={H} fill={C.surface} />

        {/* Elementos decorativos del plano (paredes/pasillos) */}
        {plano.map((el, i) => (
          <rect
            key={i}
            x={el.x} y={el.y} width={el.w} height={el.h}
            fill={el.type === 'wall' || el.type === 'pared' ? '#1e2035' : '#ffffff06'}
            rx={el.type === 'wall' || el.type === 'pared' ? 2 : 6}
          />
        ))}

        {/* Espacios de parqueo */}
        {espacios.map(e => {
          // Los espacios del endpoint /api/espacios/zona/{id}
          // tienen sus coordenadas en e.coordenadas = { x, y, w, h, angulo }
          const c = e.coordenadas || {}
          const x   = c.x ?? e.x ?? null
          const y   = c.y ?? e.y ?? null
          const w   = c.w ?? e.w ?? 52
          const h   = c.h ?? e.h ?? 72
          const ang = c.angulo ?? e.angulo ?? 0

          // Si no tiene coordenadas válidas, no renderizar
          if (x === null || y === null) return null

          const cx = x + w / 2
          const cy = y + h / 2
          const ev = estadoVisual(e)
          const color = colorPorEstado[ev] || C.accent
          const disponible = ev === 'DISPONIBLE'
          const fs = Math.min(w, h) < 40 ? 7 : 9

          return (
            <g
              key={e.id}
              transform={ang ? `rotate(${ang}, ${cx}, ${cy})` : undefined}
              onClick={() => disponible && onSelect(e)}
              style={{ cursor: disponible ? 'pointer' : 'default' }}
            >
              {/* Cuerpo del espacio */}
              <rect
                x={x + 2} y={y + 2}
                width={w - 4} height={h - 4}
                rx={5}
                fill={color + (disponible ? '22' : '15')}
                stroke={color}
                strokeWidth={disponible ? 2 : 1.5}
                strokeDasharray={disponible ? 'none' : '4 3'}
                opacity={ev === 'BLOQUEADO' || ev === 'MANTENIMIENTO' ? 0.45 : 1}
              />

              {/* Línea de orientación (frente del espacio) */}
              <line
                x1={x + w * 0.2} y1={y + 4}
                x2={x + w * 0.8} y2={y + 4}
                stroke={color} strokeWidth={2}
                strokeLinecap="round" opacity={0.5}
                pointerEvents="none"
              />

              {/* Indicador de estado (punto en esquina) */}
              <circle
                cx={x + w - 8} cy={y + 8} r={4}
                fill={color}
                pointerEvents="none"
              />

              {/* Código del espacio */}
              <text
                x={cx} y={cy + 2}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={700}
                fill={color}
                fontFamily={FF}
                pointerEvents="none"
              >
                {e.codigo}
              </text>
            </g>
          )
        })}
        </svg>
      </div>

      {/* Leyenda */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 16px', borderTop: `1px solid ${C.border}`,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Disponible',            color: C.accent },
          { label: 'Reservado en este horario', color: C.warn },
          { label: 'Ocupado',               color: '#f97316' },
          { label: 'Bloqueado',             color: C.danger },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Indicador de pasos ────────────────────────────────────────────────────
function Pasos({ actual }) {
  const pasos = ['Sede & Zona', 'Fecha & Horario', 'Espacio', 'Confirmar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {pasos.map((p, i) => {
        const done = i < actual; const active = i === actual
        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center', flex: i < pasos.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? C.teal : active ? GRAD : C.s2,
                border: `2px solid ${done ? C.teal : active ? 'transparent' : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: (done || active) ? '#fff' : C.muted, fontFamily: FF,
              }}>
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.text : C.muted, fontFamily: FF, whiteSpace: 'nowrap' }}>{p}</span>
            </div>
            {i < pasos.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? C.teal : C.border, margin: '0 6px', marginBottom: 18 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Pantalla de éxito ────────────────────────────────────────────────────
function PantallaExito({ reserva, onNuevaReserva, onMisReservas }) {
  const fmtH = dt => new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center', fontFamily: FF }}>
      {/* Ícono éxito */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(61,232,200,0.12)', border: '2px solid #3de8c8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <CheckCircle size={40} color="#3de8c8" />
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6 }}>
        ¡Reserva confirmada!
      </h2>
      <p style={{ color: C.muted, marginBottom: 28, fontSize: 14 }}>
        Tu espacio ha sido reservado exitosamente
      </p>

      {/* Resumen */}
      <Card style={{ textAlign: 'left', marginBottom: 20 }}>
        {[
          ['Espacio',  reserva.codigoEspacio],
          ['Zona',     reserva.zonaNombre],
          ['Sede',     reserva.sedeNombre],
          ['Fecha',    reserva.fechaReserva],
          ['Horario',  `${fmtH(reserva.fechaInicio)} – ${fmtH(reserva.fechaFin)}`],
          ['Estado',   'Pendiente de activación'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: k === 'Estado' ? '#f59e0b' : C.text }}>{v}</span>
          </div>
        ))}
      </Card>

      {/* Cómo activar */}
      <div style={{
        background: 'rgba(61,232,200,0.06)', border: '1px solid rgba(61,232,200,0.2)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 20, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ScanLine size={16} color="#3de8c8" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3de8c8' }}>¿Cómo activar tu reserva?</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: '1', text: `Llega al espacio ${reserva.codigoEspacio} en ${reserva.zonaNombre} dentro de tu horario (puedes llegar hasta 50 min antes).` },
            { n: '2', text: 'Busca el código QR físico pegado en el espacio y escanéalo con tu cámara — eso activará la reserva.' },
            { n: '3', text: 'Al terminar, vuelve a escanear el mismo QR del espacio para marcar tu salida.' },
          ].map(p => (
            <div key={p.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 22, height: 22, borderRadius: '50%',
                background: 'rgba(61,232,200,0.15)', border: '1.5px solid #3de8c8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#3de8c8', flexShrink: 0,
              }}>{p.n}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{p.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso importante */}
      <div style={{
        background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 24,
        display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left',
      }}>
        <Info size={14} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>Importante: </span>
          el QR que debes escanear es el del espacio físico, no el de la app. Cada espacio tiene su propio código fijo en el parqueo.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" onClick={onNuevaReserva} style={{ flex: 1, justifyContent: 'center' }}>
          Nueva reserva
        </Button>
        <Button variant="primary" onClick={onMisReservas} style={{ flex: 1, justifyContent: 'center' }}>
          Mis reservas
        </Button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
export default function Reservar() {
  const nav = useNavigate()
  const [paso,     setPaso]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const [sedes,   setSedes]   = useState([])
  const [zonas,   setZonas]   = useState([])
  const [espacios,        setEspacios]        = useState([])
  const [idsDisponibles,  setIdsDisponibles]  = useState(null) // null = sin filtro aún

  const [sedeId,       setSedeId]       = useState(null)
  const [zonaId,       setZonaId]       = useState(null)
  const [zonaData,     setZonaData]     = useState(null)
  const [fecha,        setFecha]        = useState('')
  const [franjaInicio, setFranjaInicio] = useState(null)
  const [franjaFin,    setFranjaFin]    = useState(null)
  const [tipoVehiculo, setTipoVehiculo] = useState('AUTO')
  const [espacioSel,   setEspacioSel]   = useState(null)
  const [reservaCreada,setReservaCreada]= useState(null)

  const hoy      = new Date().toISOString().split('T')[0]
  const maxFecha = new Date(Date.now() + 3*86400000).toISOString().split('T')[0]

  const HORARIOS = [
    { codigo:'A', inicio:'07:45', fin:'09:45' },
    { codigo:'B', inicio:'10:00', fin:'12:00' },
    { codigo:'C', inicio:'12:15', fin:'14:15' },
    { codigo:'D', inicio:'14:30', fin:'16:30' },
    { codigo:'E', inicio:'16:45', fin:'18:45' },
    { codigo:'F', inicio:'19:00', fin:'21:00' },
  ]

  useEffect(() => {
    auth.fetchAuth('/api/sedes')
      .then(r => r.ok ? r.json() : []).then(setSedes).catch(() => setSedes([]))
  }, [])

  useEffect(() => {
    if (!sedeId) return
    setZonaId(null); setZonaData(null); setEspacios([]); setIdsDisponibles(null)
    auth.fetchAuth(`/api/zonas/sede/${sedeId}`)
      .then(r => r.ok ? r.json() : []).then(setZonas).catch(() => setZonas([]))
  }, [sedeId])

  // Carga todos los espacios de la zona (para tener coordenadas y renderizar el mapa completo)
  useEffect(() => {
    if (!zonaId) return
    setEspacioSel(null); setIdsDisponibles(null)
    Promise.all([
      auth.fetchAuth(`/api/zonas/${zonaId}`).then(r => r.json()),
      auth.fetchAuth(`/api/espacios/zona/${zonaId}`).then(r => r.json()),
    ]).then(([zona, esp]) => {
      setZonaData(zona)
      setEspacios(Array.isArray(esp) ? esp : [])
    }).catch(() => {})
  }, [zonaId])

  // Cuando el usuario llega al paso 2, recarga disponibilidad real para el horario elegido
  // Consulta /api/espacios/disponibles con inicio y fin exactos → devuelve solo los libres
  // Con eso marcamos el resto como RESERVADO visualmente
  useEffect(() => {
    if (paso !== 2 || !zonaId || !fecha || !franjaInicio) return

    const franjaFObj  = HORARIOS.find(h => h.codigo === (franjaFin || franjaInicio))
    const franjaIObj  = HORARIOS.find(h => h.codigo === franjaInicio)
    if (!franjaIObj || !franjaFObj) return

    const inicio = `${fecha}T${franjaIObj.inicio}:00`
    const fin    = `${fecha}T${franjaFObj.fin}:00`

    // El endpoint requiere tipoVehiculo para filtrar, pero necesitamos saber
    // cuáles están ocupados para CUALQUIER tipo. Por eso consultamos todos los tipos
    // y unimos los IDs disponibles. Así mostramos correctamente los RESERVADO/OCUPADO.
    const tipos = ['AUTO', 'MOTO', 'DISCAPACITADO']
    Promise.all(
      tipos.map(tv =>
        auth.fetchAuth(
          `/api/espacios/disponibles?zonaId=${zonaId}&tipoVehiculo=${tv}&inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`
        ).then(r => r.ok ? r.json() : []).catch(() => [])
      )
    ).then(resultados => {
      // Unir todos los IDs disponibles de todos los tipos
      const ids = new Set(resultados.flat().map(e => e.id))
      setIdsDisponibles(ids)
      // Deseleccionar espacio si ya no está disponible
      setEspacioSel(prev => (prev && !ids.has(prev.id) ? null : prev))
    })
  }, [paso, zonaId, fecha, franjaInicio, franjaFin, tipoVehiculo])

  const handleFranja = (codigo) => {
    if (!franjaInicio) { setFranjaInicio(codigo); setFranjaFin(null); return }
    if (franjaInicio === codigo) { setFranjaInicio(null); setFranjaFin(null); return }
    const idxIni = franjaInicio.charCodeAt(0) - 65
    const idxSel = codigo.charCodeAt(0) - 65
    if (idxSel === idxIni + 1) setFranjaFin(codigo)
    else { setFranjaInicio(codigo); setFranjaFin(null) }
  }

  const resetear = () => {
    setPaso(0); setReservaCreada(null); setSedeId(null); setZonaId(null)
    setFecha(''); setFranjaInicio(null); setFranjaFin(null); setEspacioSel(null)
  }

  const confirmar = async () => {
    setLoading(true); setError('')
    try {
      const res = await auth.fetchAuth('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({
          zonaId: parseInt(zonaId), tipoVehiculo,
          fechaReserva: fecha, franjaInicio,
          franjaFin: franjaFin || franjaInicio,
          espacioId: espacioSel?.id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.mensaje || 'Error al crear la reserva.'); return }
      setReservaCreada(data); setPaso(4)
    } catch { setError('No se pudo conectar con el servidor.') }
    finally { setLoading(false) }
  }

  const sedeSel    = sedes.find(s => s.id === sedeId)
  const zonaSel    = zonas.find(z => z.id === zonaId)
  const zonaNombre2 = zonas.find(z2 => z.id === zonaId)
  const franjaIObj = HORARIOS.find(h => h.codigo === franjaInicio)
  const franjaFObj = HORARIOS.find(h => h.codigo === (franjaFin || franjaInicio))
  const TipoVehiculoIcon = getTipoVehiculoIcon(tipoVehiculo)

  // ── Pantalla de éxito ─────────────────────────────────────────────────
  if (paso === 4 && reservaCreada) {
    trackEvent('Reservas', 'reserva_creada', zonaNombre2)
    return (
      <PantallaExito
        reserva={reservaCreada}
        onNuevaReserva={resetear}
        onMisReservas={() => nav('/reservas')}
      />
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 56px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, fontFamily: FF }}>
        <GradText>Reservar espacio</GradText>
      </h1>
      <p style={{ color: C.muted, fontFamily: FF, marginBottom: 32, fontSize: 14 }}>
        Selecciona tu sede, zona y horario
      </p>
      <Pasos actual={paso} />

      <div style={{ display:'grid', gridTemplateColumns: paso >= 2 ? '1fr 280px' : '1fr', gap: 28, alignItems:'start' }}>
        <div>

          {/* PASO 0 — Sede & Zona */}
          {paso === 0 && (
            <div>
              <SectionLabel>Sede</SectionLabel>
              {sedes.length === 0
                ? <p style={{ color:C.muted, fontFamily:FF, fontSize:13 }}>Cargando...</p>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:28 }}>
                    {sedes.map(s => (
                      <button key={s.id} onClick={() => setSedeId(s.id)} style={{ background:sedeId===s.id?GRAD:C.surface, border:`1.5px solid ${sedeId===s.id?'transparent':C.border}`, borderRadius:14, padding:'18px 20px', cursor:'pointer', textAlign:'left' }}>
                        <MapPin size={18} color={sedeId===s.id?'#fff':C.accent} style={{ marginBottom:8 }} />
                        <p style={{ fontSize:15, fontWeight:700, color:sedeId===s.id?'#fff':C.text, fontFamily:FF }}>{s.nombre}</p>
                        <p style={{ fontSize:12, color:sedeId===s.id?'rgba(255,255,255,.7)':C.muted, fontFamily:FF, marginTop:4 }}>{s.direccion}</p>
                      </button>
                    ))}
                  </div>
              }
              {sedeId && <>
                <SectionLabel>Zona</SectionLabel>
                {zonas.length === 0
                  ? <p style={{ color:C.muted, fontFamily:FF, fontSize:13 }}>Cargando zonas...</p>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:28 }}>
                      {zonas.map(z => (
                        <button key={z.id} onClick={() => setZonaId(z.id)} style={{ background:zonaId===z.id?GRAD:C.surface, border:`1.5px solid ${zonaId===z.id?'transparent':C.border}`, borderRadius:14, padding:'18px 20px', cursor:'pointer', textAlign:'left' }}>
                          <ParkingSquare size={18} color={zonaId===z.id?'#fff':C.teal} style={{ marginBottom:8 }} />
                          <p style={{ fontSize:15, fontWeight:700, color:zonaId===z.id?'#fff':C.text, fontFamily:FF }}>{z.nombre}</p>
                          {z.descripcion && <p style={{ fontSize:12, color:zonaId===z.id?'rgba(255,255,255,.7)':C.muted, fontFamily:FF, marginTop:4 }}>{z.descripcion}</p>}
                        </button>
                      ))}
                    </div>
                }
              </>}
              <Button variant="primary" disabled={!sedeId||!zonaId} onClick={() => setPaso(1)} icon={ChevronRight}>Continuar</Button>
            </div>
          )}

          {/* PASO 1 — Fecha & Horario */}
          {paso === 1 && (
            <div>
              <SectionLabel>Tipo de vehículo</SectionLabel>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
                {Object.entries(TIPO_VEHICULO_LABEL).map(([val,{label,Icon}]) => (
                  <button key={val} onClick={() => setTipoVehiculo(val)} style={{ padding:'10px 18px', borderRadius:10, background:tipoVehiculo===val?GRAD:C.s2, border:`1.5px solid ${tipoVehiculo===val?'transparent':C.border}`, color:tipoVehiculo===val?'#fff':C.muted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FF, display:'flex', alignItems:'center', gap:7 }}>
                    <Icon size={17} color={tipoVehiculo===val ? '#fff' : C.accent} />
                    {label}
                  </button>
                ))}
              </div>

              <SectionLabel>Fecha</SectionLabel>
              <input type="date" min={hoy} max={maxFecha} value={fecha} onChange={e => setFecha(e.target.value)}
                style={{ padding:'11px 16px', borderRadius:10, marginBottom:24, background:C.s2, border:`1px solid ${C.border}`, color:C.text, fontSize:14, fontFamily:FF }} />

              <SectionLabel>Franja horaria</SectionLabel>
              <p style={{ fontSize:12, color:C.muted, fontFamily:FF, marginBottom:12 }}>Selecciona 1 franja o 2 consecutivas (máx. 2)</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:24 }}>
                {HORARIOS.map(h => {
                  const sel1=franjaInicio===h.codigo; const sel2=franjaFin===h.codigo; const sel=sel1||sel2
                  return (
                    <button key={h.codigo} onClick={() => handleFranja(h.codigo)} style={{ background:sel?GRAD:C.surface, border:`1.5px solid ${sel?'transparent':C.border}`, borderRadius:12, padding:'14px', cursor:'pointer', textAlign:'left', position:'relative' }}>
                      {sel && <div style={{ position:'absolute',top:7,right:9,background:'rgba(255,255,255,.2)',borderRadius:100,padding:'1px 7px',fontSize:9,color:'#fff',fontWeight:600,fontFamily:FF }}>{sel1?(franjaFin?'1ro':'Sel'):'2do'}</div>}
                      <p style={{ fontSize:11,fontWeight:700,color:sel?'rgba(255,255,255,.75)':C.muted,fontFamily:FF,marginBottom:4 }}>Franja {h.codigo}</p>
                      <p style={{ fontSize:14,fontWeight:700,color:sel?'#fff':C.text,fontFamily:FF }}>{h.inicio} – {h.fin}</p>
                    </button>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <Button variant="ghost" onClick={() => setPaso(0)}>Atrás</Button>
                <Button variant="primary" disabled={!fecha||!franjaInicio} onClick={() => setPaso(2)} icon={ChevronRight}>Ver mapa</Button>
              </div>
            </div>
          )}

          {/* PASO 2 — Selección de espacio */}
          {paso === 2 && (
            <div>
              <SectionLabel>Selecciona tu espacio</SectionLabel>
              <p style={{ fontSize:13, color:C.muted, fontFamily:FF, marginBottom:14 }}>
                Clic en verde para elegir espacio (opcional — si no eliges, se asigna automáticamente)
              </p>
              {espacios.length === 0
                ? <Card><p style={{ color:C.muted,fontFamily:FF,fontSize:13 }}>Cargando espacios...</p></Card>
                : <MapaReserva zona={zonaData} espacios={espacios} onSelect={e => setEspacioSel(e)} idsDisponibles={idsDisponibles} />
              }
              {espacioSel && (
                <Card style={{ marginTop:14, borderColor:C.teal+'40', background:C.teal+'08' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <ParkingSquare size={20} color={C.teal} />
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:FF }}>Espacio {espacioSel.codigo}</p>
                      <p style={{ fontSize:12, color:C.muted, fontFamily:FF }}>{TIPO_VEHICULO_LABEL[espacioSel.tipoVehiculo]?.label}</p>
                    </div>
                    <button onClick={() => setEspacioSel(null)} style={{ marginLeft:'auto',background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:18 }}>×</button>
                  </div>
                </Card>
              )}
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <Button variant="ghost" onClick={() => setPaso(1)}>Atrás</Button>
                <Button variant="primary" onClick={() => setPaso(3)} icon={ChevronRight}
                  disabled={espacioSel !== null && idsDisponibles !== null && !idsDisponibles.has(espacioSel.id)}>
                  {espacioSel ? 'Confirmar espacio' : 'Asignación automática'}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3 — Confirmar */}
          {paso === 3 && (
            <div>
              <SectionLabel>Confirma tu reserva</SectionLabel>
              <Card style={{ marginBottom:20 }}>
                {[
                  ['Sede',     sedeSel?.nombre],
                  ['Zona',     zonaSel?.nombre],
                  ['Fecha',    fecha],
                  ['Horario',  franjaIObj ? `${franjaIObj.inicio} – ${(franjaFObj||franjaIObj).fin}` : ''],
                  ['Vehículo', TIPO_VEHICULO_LABEL[tipoVehiculo]?.label],
                  ['Espacio',  espacioSel ? espacioSel.codigo : 'Asignación automática'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13,color:C.muted,fontFamily:FF }}>{k}</span>
                    <span style={{ fontSize:13,fontWeight:600,color:C.text,fontFamily:FF }}>{v}</span>
                  </div>
                ))}
              </Card>
              {error && (
                <div style={{ background:'#ff4d6d14',border:'1px solid #ff4d6d30',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',gap:10,alignItems:'center' }}>
                  <AlertTriangle size={16} color="#ff4d6d" />
                  <p style={{ fontSize:13,color:'#ff4d6d',fontFamily:FF }}>{error}</p>
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <Button variant="ghost" onClick={() => setPaso(2)} disabled={loading}>Atrás</Button>
                <Button variant="primary" onClick={confirmar} disabled={loading} icon={CheckCircle}>
                  {loading ? 'Reservando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Panel resumen lateral */}
        {paso >= 2 && (
          <div>
            <SectionLabel>Resumen</SectionLabel>
            <Card>
              {[
                [<MapPin size={14}/>,        sedeSel?.nombre],
                [<ParkingSquare size={14}/>, zonaSel?.nombre],
                [<Calendar size={14}/>,      fecha],
                [<Clock size={14}/>,         franjaIObj ? `${franjaIObj.inicio} – ${(franjaFObj||franjaIObj).fin}` : ''],
                [<TipoVehiculoIcon size={16}/>, TIPO_VEHICULO_LABEL[tipoVehiculo]?.label],
              ].filter(([,v]) => v).map(([icon,val],i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ color:C.accent }}>{icon}</span>
                  <span style={{ fontSize:13,color:C.text,fontFamily:FF }}>{val}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
