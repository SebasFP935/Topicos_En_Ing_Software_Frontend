import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  MapPin,
  ParkingSquare,
  QrCode,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button } from '../components/ui/Button'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const TIPO_VEHICULO_LABEL = {
  AUTO: { label: 'Auto', icon: 'A' },
  MOTO: { label: 'Moto', icon: 'M' },
  DISCAPACITADO: { label: 'Discapacitado', icon: 'D' },
  ELECTRICO: { label: 'Electrico', icon: 'E' },
}

const HORARIOS = [
  { codigo: 'A', inicio: '07:45', fin: '09:45' },
  { codigo: 'B', inicio: '10:00', fin: '12:00' },
  { codigo: 'C', inicio: '12:15', fin: '14:15' },
  { codigo: 'D', inicio: '14:30', fin: '16:30' },
  { codigo: 'E', inicio: '16:45', fin: '18:45' },
  { codigo: 'F', inicio: '19:00', fin: '21:00' },
]

function QRImage({ value, size = 200 }) {
  const url = `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size}&dark=3de8c8&light=0d0e1f&margin=1`
  return <img src={url} alt="Codigo QR de reserva" width={size} height={size} style={{ borderRadius: 12, display: 'block' }} />
}

function toHorario(codigo) {
  return HORARIOS.find((h) => h.codigo === codigo)
}

function isoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoLocal(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null
  const [yy, mm, dd] = iso.split('-').map(Number)
  const dt = new Date(yy, mm - 1, dd)
  if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null
  return dt
}

function clampIsoRange(iso, minIso, maxIso) {
  const dt = parseIsoLocal(iso)
  const min = parseIsoLocal(minIso)
  const max = parseIsoLocal(maxIso)
  if (!dt || !min || !max) return ''
  if (dt < min) return minIso
  if (dt > max) return maxIso
  return iso
}

function MapaReserva({ mapa, espacios, onSelect, idsDisponibles, tipoVehiculo }) {
  const W = mapa?.mapaAncho || 800
  const H = mapa?.mapaAlto || 500
  const plano = mapa?.plano || []
  const planoImagen = mapa?.planoImagen || null

  const estadoVisual = (espacio) => {
    if (espacio.estado === 'BLOQUEADO') return 'BLOQUEADO'
    if (espacio.estado === 'MANTENIMIENTO') return 'MANTENIMIENTO'
    if (idsDisponibles !== null) {
      if (espacio.estado === 'OCUPADO') return 'OCUPADO'
      if (!idsDisponibles.has(espacio.id)) return 'RESERVADO'
      return 'DISPONIBLE'
    }
    return espacio.estado || 'DISPONIBLE'
  }

  const colorPorEstado = {
    DISPONIBLE: '#3de8c8',
    RESERVADO: '#a259ff',
    OCUPADO: '#ffaa00',
    BLOQUEADO: '#ff4d6d',
    MANTENIMIENTO: '#ff4d6d',
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg }}>
      {idsDisponibles === null && (
        <div
          style={{
            padding: '8px 14px',
            background: '#5b7eff10',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: `2px solid ${C.border}`,
              borderTopColor: C.accent,
              animation: 'spin .8s linear infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>Consultando disponibilidad para el horario seleccionado...</span>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 360, display: 'block' }}>
        {planoImagen && <image href={planoImagen} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid meet" opacity={0.92} />}

        {plano.map((el, i) => (
          <rect
            key={`plano-${i}`}
            x={el.x}
            y={el.y}
            width={el.w}
            height={el.h}
            fill={el.type === 'wall' || el.type === 'pared' ? '#1e2035' : '#ffffff08'}
            rx={el.type === 'wall' || el.type === 'pared' ? 2 : 6}
          />
        ))}

        {espacios.map((e) => {
          const x = Number(e.x)
          const y = Number(e.y)
          const w = Number(e.w || 72)
          const h = Number(e.h || 140)
          const angulo = Number(e.angulo || 0)
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null

          const ev = estadoVisual(e)
          const compatible = e.tipoVehiculo === tipoVehiculo
          const disponible = ev === 'DISPONIBLE' && compatible
          const color = colorPorEstado[ev] || '#3de8c8'
          const cx = x + w / 2
          const cy = y + h / 2

          return (
            <g key={e.id} transform={`translate(${cx} ${cy}) rotate(${angulo})`} onClick={() => disponible && onSelect(e)} style={{ cursor: disponible ? 'pointer' : 'not-allowed' }}>
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx={8}
                fill={`${color}22`}
                stroke={color}
                strokeWidth={disponible ? 2 : 1.4}
                strokeDasharray={disponible ? 'none' : '4 3'}
                opacity={compatible ? 1 : 0.45}
              />
              <text x={0} y={-6} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily={FF}>
                {e.codigo}
              </text>
              <text x={0} y={10} textAnchor="middle" fill={`${color}bb`} fontSize={9} fontFamily={FF}>
                {e.tipoVehiculo}
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 18, padding: '10px 14px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        {[
          ['#3de8c8', 'Disponible'],
          ['#a259ff', 'Reservado en este horario'],
          ['#ffaa00', 'Ocupado'],
          ['#ff4d6d', 'Bloqueado'],
        ].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pasos({ actual }) {
  const pasos = ['Sede y zona', 'Fecha y horario', 'Espacio', 'Confirmar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {pasos.map((p, i) => {
        const done = i < actual
        const active = i === actual
        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center', flex: i < pasos.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: done ? C.teal : active ? GRAD : C.s2,
                  border: `2px solid ${done ? C.teal : active ? 'transparent' : C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: done || active ? '#fff' : C.muted,
                  fontFamily: FF,
                }}
              >
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.text : C.muted, fontFamily: FF, whiteSpace: 'nowrap' }}>{p}</span>
            </div>
            {i < pasos.length - 1 && <div style={{ flex: 1, height: 2, background: done ? C.teal : C.border, margin: '0 6px', marginBottom: 18 }} />}
          </div>
        )
      })}
    </div>
  )
}

function PantallaExito({ reserva, onNuevaReserva, onMisReservas }) {
  const fmtH = (dt) => new Date(dt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const qrValue = reserva.qrUrl || reserva.qrToken || reserva.codigoQr

  const handleDownload = () => {
    const url = `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=400&dark=3de8c8&light=0d0e1f&margin=2`
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${reserva.codigoEspacio}.png`
    a.target = '_blank'
    a.click()
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${C.teal}20`,
          border: `2px solid ${C.teal}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <CheckCircle size={40} color={C.teal} />
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 6 }}>Reserva confirmada</h2>
      <p style={{ color: C.muted, fontFamily: FF, marginBottom: 28, fontSize: 14 }}>Tu espacio ha sido reservado exitosamente</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
          textAlign: 'left',
        }}
      >
        <Card>
          {[
            ['Espacio', reserva.codigoEspacio],
            ['Zona', reserva.zonaNombre],
            ['Sede', reserva.sedeNombre],
            ['Fecha', reserva.fechaReserva],
            ['Horario', `${fmtH(reserva.fechaInicio)} - ${fmtH(reserva.fechaFin)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <QrCode size={14} color={C.accent} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FF }}>Codigo QR</span>
          </div>
          <div style={{ padding: 12, background: '#0d0e1f', borderRadius: 12, border: `1px solid ${C.border}` }}>
            <QRImage value={qrValue} size={160} />
          </div>
          <button
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 8,
              background: C.s2,
              border: `1px solid ${C.border}`,
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FF,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Download size={12} /> Guardar QR
          </button>
        </Card>
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

export default function Reservar() {
  const nav = useNavigate()

  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sedes, setSedes] = useState([])
  const [zonas, setZonas] = useState([])
  const [mapaZona, setMapaZona] = useState(null)
  const [espacios, setEspacios] = useState([])
  const [idsDisponibles, setIdsDisponibles] = useState(null)

  const [sedeId, setSedeId] = useState(null)
  const [zonaId, setZonaId] = useState(null)
  const [fecha, setFecha] = useState(() => isoLocal(new Date()))
  const [franjaInicio, setFranjaInicio] = useState(null)
  const [franjaFin, setFranjaFin] = useState(null)
  const [tipoVehiculo, setTipoVehiculo] = useState('AUTO')
  const [espacioSel, setEspacioSel] = useState(null)
  const [reservaCreada, setReservaCreada] = useState(null)

  const ahora = new Date()
  const hoy = isoLocal(ahora)
  const maxFecha = isoLocal(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 3))

  useEffect(() => {
    auth
      .fetchAuth('/api/sedes')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSedes(Array.isArray(data) ? data : []))
      .catch(() => setSedes([]))
  }, [])

  useEffect(() => {
    if (!sedeId) return
    setZonaId(null)
    setMapaZona(null)
    setEspacios([])
    setIdsDisponibles(null)
    auth
      .fetchAuth(`/api/zonas/sede/${sedeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setZonas(Array.isArray(data) ? data : []))
      .catch(() => setZonas([]))
  }, [sedeId])

  useEffect(() => {
    if (!zonaId) return
    setEspacioSel(null)
    setIdsDisponibles(null)
    auth
      .fetchAuth(`/api/zonas/${zonaId}/mapa`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((mapa) => {
        setMapaZona({
          mapaAncho: mapa?.mapaAncho || 800,
          mapaAlto: mapa?.mapaAlto || 500,
          plano: Array.isArray(mapa?.plano) ? mapa.plano : [],
          planoImagen: mapa?.planoImagen || null,
        })
        setEspacios(Array.isArray(mapa?.espacios) ? mapa.espacios : [])
      })
      .catch(() => {
        setMapaZona({ mapaAncho: 800, mapaAlto: 500, plano: [], planoImagen: null })
        setEspacios([])
      })
  }, [zonaId])

  useEffect(() => {
    if (paso !== 2 || !zonaId || !fecha || !franjaInicio) return

    const franjaIObj = toHorario(franjaInicio)
    const franjaFObj = toHorario(franjaFin || franjaInicio)
    if (!franjaIObj || !franjaFObj) return

    const inicio = `${fecha}T${franjaIObj.inicio}:00`
    const fin = `${fecha}T${franjaFObj.fin}:00`

    const tipos = ['AUTO', 'MOTO', 'DISCAPACITADO', 'ELECTRICO']
    Promise.all(
      tipos.map((tv) =>
        auth
          .fetchAuth(
            `/api/espacios/disponibles?zonaId=${zonaId}&tipoVehiculo=${tv}&inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`
          )
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    ).then((resultados) => {
      const ids = new Set(resultados.flat().map((e) => e.id))
      setIdsDisponibles(ids)
      setEspacioSel((prev) => (prev && !ids.has(prev.id) ? null : prev))
    })
  }, [paso, zonaId, fecha, franjaInicio, franjaFin, tipoVehiculo])

  const handleFranja = (codigo) => {
    if (!franjaInicio) {
      setFranjaInicio(codigo)
      setFranjaFin(null)
      return
    }
    if (franjaInicio === codigo) {
      setFranjaInicio(null)
      setFranjaFin(null)
      return
    }
    const idxIni = franjaInicio.charCodeAt(0) - 65
    const idxSel = codigo.charCodeAt(0) - 65
    if (idxSel === idxIni + 1) setFranjaFin(codigo)
    else {
      setFranjaInicio(codigo)
      setFranjaFin(null)
    }
  }

  const handleFechaChange = (nextValue) => {
    if (!nextValue) {
      setFecha('')
      return
    }
    setFecha(clampIsoRange(nextValue, hoy, maxFecha))
  }

  const confirmar = async () => {
    const fechaSel = parseIsoLocal(fecha)
    const fechaMin = parseIsoLocal(hoy)
    const fechaMax = parseIsoLocal(maxFecha)
    if (!fechaSel || !fechaMin || !fechaMax) {
      setError('Fecha invalida. Selecciona una fecha valida.')
      return
    }
    if (fechaSel < fechaMin) {
      setError(`La fecha ${fecha} ya paso. Selecciona hoy (${hoy}) o una fecha futura.`)
      return
    }
    if (fechaSel > fechaMax) {
      setError(`La fecha ${fecha} supera el limite permitido. Maximo: ${maxFecha}.`)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await auth.fetchAuth('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({
          zonaId: parseInt(zonaId, 10),
          tipoVehiculo,
          fechaReserva: fecha,
          franjaInicio,
          franjaFin: franjaFin || franjaInicio,
          espacioId: espacioSel?.id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.mensaje || 'Error al crear la reserva.')
        return
      }
      setReservaCreada(data)
      setPaso(4)
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const resetear = () => {
    setPaso(0)
    setReservaCreada(null)
    setSedeId(null)
    setZonaId(null)
    setFecha('')
    setFranjaInicio(null)
    setFranjaFin(null)
    setEspacioSel(null)
  }

  const sedeSel = useMemo(() => sedes.find((s) => s.id === sedeId), [sedes, sedeId])
  const zonaSel = useMemo(() => zonas.find((z) => z.id === zonaId), [zonas, zonaId])
  const franjaIObj = toHorario(franjaInicio)
  const franjaFObj = toHorario(franjaFin || franjaInicio)

  if (paso === 4 && reservaCreada) {
    return <PantallaExito reserva={reservaCreada} onNuevaReserva={resetear} onMisReservas={() => nav('/reservas')} />
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px 56px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, fontFamily: FF }}>
        <GradText>Reservar espacio</GradText>
      </h1>
      <p style={{ color: C.muted, fontFamily: FF, marginBottom: 32, fontSize: 14 }}>Selecciona tu sede, zona y horario</p>
      <Pasos actual={paso} />

      <div style={{ display: 'grid', gridTemplateColumns: paso >= 2 ? '1fr 280px' : '1fr', gap: 28, alignItems: 'start' }}>
        <div>
          {paso === 0 && (
            <div>
              <SectionLabel>Sede</SectionLabel>
              {sedes.length === 0 ? (
                <p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>Cargando...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 28 }}>
                  {sedes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSedeId(s.id)}
                      style={{
                        background: sedeId === s.id ? GRAD : C.surface,
                        border: `1.5px solid ${sedeId === s.id ? 'transparent' : C.border}`,
                        borderRadius: 14,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <MapPin size={18} color={sedeId === s.id ? '#fff' : C.accent} style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 15, fontWeight: 700, color: sedeId === s.id ? '#fff' : C.text, fontFamily: FF }}>{s.nombre}</p>
                      <p style={{ fontSize: 12, color: sedeId === s.id ? 'rgba(255,255,255,.7)' : C.muted, fontFamily: FF, marginTop: 4 }}>
                        {s.direccion}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {sedeId && (
                <>
                  <SectionLabel>Zona</SectionLabel>
                  {zonas.length === 0 ? (
                    <p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>Cargando zonas...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 28 }}>
                      {zonas.map((z) => (
                        <button
                          key={z.id}
                          onClick={() => setZonaId(z.id)}
                          style={{
                            background: zonaId === z.id ? GRAD : C.surface,
                            border: `1.5px solid ${zonaId === z.id ? 'transparent' : C.border}`,
                            borderRadius: 14,
                            padding: '18px 20px',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <ParkingSquare size={18} color={zonaId === z.id ? '#fff' : C.teal} style={{ marginBottom: 8 }} />
                          <p style={{ fontSize: 15, fontWeight: 700, color: zonaId === z.id ? '#fff' : C.text, fontFamily: FF }}>{z.nombre}</p>
                          {z.descripcion && (
                            <p style={{ fontSize: 12, color: zonaId === z.id ? 'rgba(255,255,255,.7)' : C.muted, fontFamily: FF, marginTop: 4 }}>
                              {z.descripcion}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Button variant="primary" disabled={!sedeId || !zonaId} onClick={() => setPaso(1)} icon={ChevronRight}>
                Continuar
              </Button>
            </div>
          )}

          {paso === 1 && (
            <div>
              <SectionLabel>Tipo de vehiculo</SectionLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                {Object.entries(TIPO_VEHICULO_LABEL).map(([val, meta]) => (
                  <button
                    key={val}
                    onClick={() => setTipoVehiculo(val)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: tipoVehiculo === val ? GRAD : C.s2,
                      border: `1.5px solid ${tipoVehiculo === val ? 'transparent' : C.border}`,
                      color: tipoVehiculo === val ? '#fff' : C.muted,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: FF,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                  </button>
                ))}
              </div>

              <SectionLabel>Fecha</SectionLabel>
              <input
                type="date"
                min={hoy}
                max={maxFecha}
                value={fecha}
                onChange={(e) => handleFechaChange(e.target.value)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  marginBottom: 24,
                  background: C.s2,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontSize: 14,
                  fontFamily: FF,
                }}
              />

              <SectionLabel>Franja horaria</SectionLabel>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: FF, marginBottom: 12 }}>Selecciona 1 franja o 2 consecutivas (maximo 2)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 24 }}>
                {HORARIOS.map((h) => {
                  const sel1 = franjaInicio === h.codigo
                  const sel2 = franjaFin === h.codigo
                  const sel = sel1 || sel2
                  return (
                    <button
                      key={h.codigo}
                      onClick={() => handleFranja(h.codigo)}
                      style={{
                        background: sel ? GRAD : C.surface,
                        border: `1.5px solid ${sel ? 'transparent' : C.border}`,
                        borderRadius: 12,
                        padding: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 700, color: sel ? 'rgba(255,255,255,.75)' : C.muted, fontFamily: FF, marginBottom: 4 }}>
                        Franja {h.codigo}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: sel ? '#fff' : C.text, fontFamily: FF }}>
                        {h.inicio} - {h.fin}
                      </p>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => setPaso(0)}>
                  Atras
                </Button>
                <Button variant="primary" disabled={!fecha || !franjaInicio} onClick={() => setPaso(2)} icon={ChevronRight}>
                  Ver mapa
                </Button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <SectionLabel>Selecciona tu espacio</SectionLabel>
              <p style={{ fontSize: 13, color: C.muted, fontFamily: FF, marginBottom: 14 }}>
                Se muestran los espacios del mapa de esta zona. Solo se puede elegir un espacio compatible y disponible.
              </p>

              {espacios.length === 0 ? (
                <Card>
                  <p style={{ color: C.muted, fontFamily: FF, fontSize: 13 }}>No hay espacios configurados para esta zona.</p>
                </Card>
              ) : (
                <MapaReserva
                  mapa={mapaZona}
                  espacios={espacios}
                  onSelect={(e) => setEspacioSel(e)}
                  idsDisponibles={idsDisponibles}
                  tipoVehiculo={tipoVehiculo}
                />
              )}

              {espacioSel && (
                <Card style={{ marginTop: 14, borderColor: `${C.teal}40`, background: `${C.teal}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ParkingSquare size={20} color={C.teal} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>Espacio {espacioSel.codigo}</p>
                      <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>
                        {TIPO_VEHICULO_LABEL[espacioSel.tipoVehiculo]?.label || espacioSel.tipoVehiculo}
                      </p>
                    </div>
                    <button
                      onClick={() => setEspacioSel(null)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}
                    >
                      x
                    </button>
                  </div>
                </Card>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Button variant="ghost" onClick={() => setPaso(1)}>
                  Atras
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setPaso(3)}
                  icon={ChevronRight}
                  disabled={espacioSel !== null && idsDisponibles !== null && !idsDisponibles.has(espacioSel.id)}
                >
                  {espacioSel ? 'Confirmar espacio' : 'Asignacion automatica'}
                </Button>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div>
              <SectionLabel>Confirma tu reserva</SectionLabel>
              <Card style={{ marginBottom: 20 }}>
                {[
                  ['Sede', sedeSel?.nombre],
                  ['Zona', zonaSel?.nombre],
                  ['Fecha', fecha],
                  ['Horario', franjaIObj ? `${franjaIObj.inicio} - ${(franjaFObj || franjaIObj).fin}` : ''],
                  ['Vehiculo', TIPO_VEHICULO_LABEL[tipoVehiculo]?.label],
                  ['Espacio', espacioSel ? espacioSel.codigo : 'Asignacion automatica'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{v}</span>
                  </div>
                ))}
              </Card>

              {error && (
                <div
                  style={{
                    background: '#ff4d6d14',
                    border: '1px solid #ff4d6d30',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <AlertTriangle size={16} color="#ff4d6d" />
                  <p style={{ fontSize: 13, color: '#ff4d6d', fontFamily: FF }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => setPaso(2)} disabled={loading}>
                  Atras
                </Button>
                <Button variant="primary" onClick={confirmar} disabled={loading} icon={CheckCircle}>
                  {loading ? 'Reservando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {paso >= 2 && (
          <div>
            <SectionLabel>Resumen</SectionLabel>
            <Card>
              {[
                [<MapPin size={14} />, sedeSel?.nombre],
                [<ParkingSquare size={14} />, zonaSel?.nombre],
                [<Calendar size={14} />, fecha],
                [<Clock size={14} />, franjaIObj ? `${franjaIObj.inicio} - ${(franjaFObj || franjaIObj).fin}` : ''],
                [<Car size={14} />, TIPO_VEHICULO_LABEL[tipoVehiculo]?.label],
              ]
                .filter(([, value]) => value)
                .map(([icon, value], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.accent }}>{icon}</span>
                    <span style={{ fontSize: 13, color: C.text, fontFamily: FF }}>{value}</span>
                  </div>
                ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
