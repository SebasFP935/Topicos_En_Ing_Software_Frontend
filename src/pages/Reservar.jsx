// src/pages/Reservar.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Calendar, Car, CheckCircle, ChevronRight, AlertTriangle, ParkingSquare } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card }         from '../components/ui/Card'
import { Badge }        from '../components/ui/Badge'
import { GradText }     from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button }       from '../components/ui/Button'
import { auth }         from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const TIPO_VEHICULO_LABEL = {
  AUTO:          { label: 'Auto',         icon: '🚗' },
  MOTO:          { label: 'Moto',         icon: '🏍️' },
  DISCAPACITADO: { label: 'Discapacidad', icon: '♿' },
  ELECTRICO:     { label: 'Eléctrico',    icon: '⚡' },
}

// ── Mapa SVG ──────────────────────────────────────────────────────────────────
function MapaReserva({ zona, espacios, onSelect }) {
  const W = zona?.mapaAncho || 800
  const H = zona?.mapaAlto  || 500
  const plano = zona?.plano || []

  const colorEspacio = (e) => {
    if (e.estado === 'BLOQUEADO' || e.estado === 'MANTENIMIENTO') return '#ff4d6d'
    if (e.estado === 'OCUPADO')   return '#ffaa00'
    return '#3de8c8'
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 360, display: 'block' }}>
        {plano.map(el => (
          <rect key={el.id} x={el.x} y={el.y} width={el.w} height={el.h}
            fill={el.type === 'pared' ? '#1e2035' : '#ffffff08'} rx={el.type === 'pared' ? 2 : 6} />
        ))}
        {espacios.map(e => {
          const c = e.coordenadas || {}
          if (!c.x && c.x !== 0) return null
          const color = colorEspacio(e)
          const disponible = e.estado === 'DISPONIBLE'
          return (
            <g key={e.id} onClick={() => disponible && onSelect(e)}
              style={{ cursor: disponible ? 'pointer' : 'not-allowed' }}>
              <rect x={c.x} y={c.y} width={c.w || 72} height={c.h || 140} rx={8}
                fill={color + '22'} stroke={color} strokeWidth={disponible ? 2 : 1.5}
                strokeDasharray={disponible ? 'none' : '4 3'} />
              <text x={c.x + (c.w||72)/2} y={c.y + (c.h||140)/2 - 6}
                textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily={FF}>
                {e.codigo}
              </text>
              <text x={c.x + (c.w||72)/2} y={c.y + (c.h||140)/2 + 10}
                textAnchor="middle" fill={color + 'bb'} fontSize={9} fontFamily={FF}>
                {e.tipoVehiculo}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 18, padding: '10px 14px', borderTop: `1px solid ${C.border}` }}>
        {[['#3de8c8','Disponible'],['#ffaa00','Ocupado'],['#ff4d6d','Bloqueado']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pasos ─────────────────────────────────────────────────────────────────────
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

// ── Principal ─────────────────────────────────────────────────────────────────
export default function Reservar() {
  const nav = useNavigate()
  const [paso,     setPaso]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const [sedes,   setSedes]   = useState([])
  const [zonas,   setZonas]   = useState([])
  const [espacios,setEspacios]= useState([])

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
    setZonaId(null); setZonaData(null); setEspacios([])
    auth.fetchAuth(`/api/zonas/sede/${sedeId}`)
      .then(r => r.ok ? r.json() : []).then(setZonas).catch(() => setZonas([]))
  }, [sedeId])

  useEffect(() => {
    if (!zonaId) return
    setEspacioSel(null)
    Promise.all([
      auth.fetchAuth(`/api/zonas/${zonaId}`).then(r => r.json()),
      auth.fetchAuth(`/api/espacios/zona/${zonaId}`).then(r => r.json()),
    ]).then(([zona, esp]) => {
      setZonaData(zona)
      setEspacios(Array.isArray(esp) ? esp : [])
    }).catch(() => {})
  }, [zonaId])

  const handleFranja = (codigo) => {
    if (!franjaInicio) { setFranjaInicio(codigo); setFranjaFin(null); return }
    if (franjaInicio === codigo) { setFranjaInicio(null); setFranjaFin(null); return }
    const idxIni = franjaInicio.charCodeAt(0) - 65
    const idxSel = codigo.charCodeAt(0) - 65
    if (idxSel === idxIni + 1) setFranjaFin(codigo)
    else { setFranjaInicio(codigo); setFranjaFin(null) }
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
  const franjaIObj = HORARIOS.find(h => h.codigo === franjaInicio)
  const franjaFObj = HORARIOS.find(h => h.codigo === (franjaFin || franjaInicio))

  // ── Éxito ────────────────────────────────────────────────────────
  if (paso === 4 && reservaCreada) {
    const fmtH = dt => new Date(dt).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.teal+'20', border:`2px solid ${C.teal}`, display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}>
          <CheckCircle size={40} color={C.teal} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 8 }}>¡Reserva confirmada!</h2>
        <p style={{ color: C.muted, fontFamily: FF, marginBottom: 28 }}>Tu espacio ha sido reservado exitosamente</p>
        <Card style={{ textAlign: 'left', marginBottom: 24 }}>
          {[
            ['Espacio',  reservaCreada.codigoEspacio],
            ['Zona',     reservaCreada.zonaNombre],
            ['Sede',     reservaCreada.sedeNombre],
            ['Fecha',    reservaCreada.fechaReserva],
            ['Horario',  `${fmtH(reservaCreada.fechaInicio)} – ${fmtH(reservaCreada.fechaFin)}`],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:13, color:C.muted, fontFamily:FF }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:FF }}>{v}</span>
            </div>
          ))}
          <div style={{ padding:'10px 0 0' }}>
            <p style={{ fontSize:11, color:C.muted, fontFamily:FF, marginBottom:4 }}>Código QR</p>
            <p style={{ fontSize:11, color:C.accent, fontFamily:'monospace', wordBreak:'break-all' }}>{reservaCreada.codigoQr}</p>
          </div>
        </Card>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="secondary" onClick={() => { setPaso(0);setReservaCreada(null);setSedeId(null);setZonaId(null);setFecha('');setFranjaInicio(null);setFranjaFin(null);setEspacioSel(null) }} style={{ flex:1 }}>
            Nueva reserva
          </Button>
          <Button variant="primary" onClick={() => nav('/reservas')} style={{ flex:1 }}>Mis reservas</Button>
        </div>
      </div>
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

          {/* PASO 0 */}
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

          {/* PASO 1 */}
          {paso === 1 && (
            <div>
              <SectionLabel>Tipo de vehículo</SectionLabel>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
                {Object.entries(TIPO_VEHICULO_LABEL).map(([val,{label,icon}]) => (
                  <button key={val} onClick={() => setTipoVehiculo(val)} style={{ padding:'10px 18px', borderRadius:10, background:tipoVehiculo===val?GRAD:C.s2, border:`1.5px solid ${tipoVehiculo===val?'transparent':C.border}`, color:tipoVehiculo===val?'#fff':C.muted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FF, display:'flex', alignItems:'center', gap:7 }}>
                    <span>{icon}</span>{label}
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
                <Button variant="secondary" onClick={() => setPaso(0)}>Atrás</Button>
                <Button variant="primary" disabled={!fecha||!franjaInicio} onClick={() => setPaso(2)} icon={ChevronRight}>Ver mapa</Button>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div>
              <SectionLabel>Selecciona tu espacio</SectionLabel>
              <p style={{ fontSize:13, color:C.muted, fontFamily:FF, marginBottom:14 }}>
                Clic en verde para elegir espacio (opcional — si no eliges, se asigna automáticamente)
              </p>
              {espacios.length === 0
                ? <Card><p style={{ color:C.muted,fontFamily:FF,fontSize:13 }}>Cargando espacios...</p></Card>
                : <MapaReserva zona={zonaData} espacios={espacios} onSelect={e => setEspacioSel(e)} />
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
                <Button variant="secondary" onClick={() => setPaso(1)}>Atrás</Button>
                <Button variant="primary" onClick={() => setPaso(3)} icon={ChevronRight}>
                  {espacioSel ? 'Confirmar espacio' : 'Asignación automática'}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
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
                <Button variant="secondary" onClick={() => setPaso(2)} disabled={loading}>Atrás</Button>
                <Button variant="primary" onClick={confirmar} disabled={loading} icon={CheckCircle}>
                  {loading ? 'Reservando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        {paso >= 2 && (
          <div>
            <SectionLabel>Resumen</SectionLabel>
            <Card>
              {[
                [<MapPin size={14}/>,       sedeSel?.nombre],
                [<ParkingSquare size={14}/>, zonaSel?.nombre],
                [<Calendar size={14}/>,     fecha],
                [<Clock size={14}/>,        franjaIObj ? `${franjaIObj.inicio} – ${(franjaFObj||franjaIObj).fin}` : ''],
                [<Car size={14}/>,          TIPO_VEHICULO_LABEL[tipoVehiculo]?.label],
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