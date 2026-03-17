// src/pages/OperadorZonas.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ParkingSquare, Edit3, ChevronRight, Plus, X } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"
const TIPOS_ZONA = ['CUBIERTO', 'DESCUBIERTO', 'TECHADO']
const TIPO_COLOR = { CUBIERTO: '#5b7eff', DESCUBIERTO: '#3de8c8', TECHADO: '#a259ff' }

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'#00000088', display:'flex', alignItems:'center', justifyContent:'center', zIndex:600, padding:20 }}
      onClick={onClose}
    >
      <div
        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:24, width:'100%', maxWidth:440, boxShadow:'0 24px 60px #00000060' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:FF }}>{title}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted }}><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputSt = {
  width:'100%', padding:'10px 12px', borderRadius:9,
  background:C.s2, border:`1px solid ${C.border}`,
  color:C.text, fontSize:14, fontFamily:FF,
  boxSizing:'border-box', outline:'none',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ fontSize:12, fontWeight:600, color:C.muted, fontFamily:FF, marginBottom:6 }}>{label}</p>
      {children}
    </div>
  )
}

function ModalNuevaSede({ onClose, onCreada }) {
  const [form, setForm] = useState({ nombre:'', direccion:'', latitud:'', longitud:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError('')
    try {
      const res = await auth.fetchAuth('/api/sedes', {
        method: 'POST',
        body: JSON.stringify({
          nombre:    form.nombre.trim(),
          direccion: form.direccion.trim() || null,
          latitud:   form.latitud  ? parseFloat(form.latitud)  : null,
          longitud:  form.longitud ? parseFloat(form.longitud) : null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.mensaje || 'Error al crear la sede')
      onCreada(d)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Nueva sede" onClose={onClose}>
      {error && <div style={{ background:'#ff4d6d14', border:'1px solid #ff4d6d30', borderRadius:9, padding:'9px 12px', marginBottom:14, color:'#ff4d6d', fontSize:13, fontFamily:FF }}>{error}</div>}
      <Field label="Nombre *">
        <input autoFocus style={inputSt} value={form.nombre} onChange={e => set('nombre', e.target.value)} onKeyDown={e => e.key==='Enter' && handleSave()} placeholder="Ej. Sede Central UPB" />
      </Field>
      <Field label="Dirección">
        <input style={inputSt} value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Ej. Av. Villazón 1234" />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Latitud (opcional)">
          <input style={inputSt} type="number" step="any" value={form.latitud} onChange={e => set('latitud', e.target.value)} placeholder="-16.5..." />
        </Field>
        <Field label="Longitud (opcional)">
          <input style={inputSt} type="number" step="any" value={form.longitud} onChange={e => set('longitud', e.target.value)} placeholder="-68.1..." />
        </Field>
      </div>
      <button
        onClick={handleSave} disabled={saving}
        style={{ width:'100%', marginTop:8, padding:'11px 0', borderRadius:10, background:saving?C.border:GRAD, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'default':'pointer', fontFamily:FF }}
      >{saving ? 'Guardando…' : 'Crear sede'}</button>
    </Modal>
  )
}

function ModalNuevaZona({ sedeId, onClose, onCreada }) {
  const [form, setForm] = useState({ nombre:'', descripcion:'', tipo:'DESCUBIERTO' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError('')
    try {
      const res = await auth.fetchAuth('/api/zonas', {
        method: 'POST',
        body: JSON.stringify({
          sedeId,
          nombre:      form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          tipo:        form.tipo,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.mensaje || 'Error al crear la zona')
      onCreada(d)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Nueva zona" onClose={onClose}>
      {error && <div style={{ background:'#ff4d6d14', border:'1px solid #ff4d6d30', borderRadius:9, padding:'9px 12px', marginBottom:14, color:'#ff4d6d', fontSize:13, fontFamily:FF }}>{error}</div>}
      <Field label="Nombre *">
        <input autoFocus style={inputSt} value={form.nombre} onChange={e => set('nombre', e.target.value)} onKeyDown={e => e.key==='Enter' && handleSave()} placeholder="Ej. Planta Baja" />
      </Field>
      <Field label="Descripción (opcional)">
        <input style={inputSt} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej. Zona A — acceso portón norte" />
      </Field>
      <Field label="Tipo de zona">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {TIPOS_ZONA.map(t => {
            const color = TIPO_COLOR[t]; const active = form.tipo === t
            return (
              <button key={t} onClick={() => set('tipo', t)} style={{ padding:'7px 16px', borderRadius:8, cursor:'pointer', fontFamily:FF, fontSize:12, fontWeight:700, background:active?color+'22':C.s2, border:`1px solid ${active?color:C.border}`, color:active?color:C.muted }}>
                {t}
              </button>
            )
          })}
        </div>
      </Field>
      <button
        onClick={handleSave} disabled={saving}
        style={{ width:'100%', marginTop:8, padding:'11px 0', borderRadius:10, background:saving?C.border:GRAD, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'default':'pointer', fontFamily:FF }}
      >{saving ? 'Guardando…' : 'Crear zona'}</button>
    </Modal>
  )
}

function ZonaCard({ zona, onEdit }) {
  const color = TIPO_COLOR[zona.tipo] || C.accent
  return (
    <div
      onClick={onEdit}
      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', cursor:'pointer', transition:'border-color .15s, transform .1s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='none' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ParkingSquare size={22} color={color}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color, background:color+'14', border:`1px solid ${color}30`, borderRadius:100, padding:'3px 10px', fontFamily:FF }}>{zona.tipo}</span>
      </div>
      <p style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:FF, marginBottom:4 }}>{zona.nombre}</p>
      {zona.descripcion && <p style={{ fontSize:12, color:C.muted, fontFamily:FF, marginBottom:14, lineHeight:1.4 }}>{zona.descripcion}</p>}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
        <Edit3 size={13} color={C.accent}/>
        <span style={{ fontSize:12, fontWeight:700, color:C.accent, fontFamily:FF }}>Editar plano</span>
        <ChevronRight size={16} color={C.muted} style={{ marginLeft:'auto' }}/>
      </div>
    </div>
  )
}

export default function OperadorZonas() {
  const navigate = useNavigate()
  const [sedes, setSedes] = useState([])
  const [zonasBySede, setZonasBySede] = useState({})
  const [sedeActiva, setSedeActiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingZonas, setLoadingZonas] = useState(false)
  const [mNuevaSede, setMNuevaSede] = useState(false)
  const [mNuevaZona, setMNuevaZona] = useState(false)

  useEffect(() => {
    auth.fetchAuth('/api/sedes')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSedes(data); if (data.length > 0) setSedeActiva(data[0].id) })
      .catch(() => setSedes([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!sedeActiva || zonasBySede[sedeActiva] !== undefined) return
    setLoadingZonas(true)
    auth.fetchAuth(`/api/zonas/sede/${sedeActiva}`)
      .then(r => r.ok ? r.json() : [])
      .then(zonas => setZonasBySede(prev => ({ ...prev, [sedeActiva]: zonas })))
      .catch(() => setZonasBySede(prev => ({ ...prev, [sedeActiva]: [] })))
      .finally(() => setLoadingZonas(false))
  }, [sedeActiva])

  const onSedeCreada = (sede) => {
    setSedes(prev => [...prev, sede])
    setSedeActiva(sede.id)
    setMNuevaSede(false)
  }

  const onZonaCreada = (zona) => {
    setZonasBySede(prev => ({ ...prev, [sedeActiva]: [...(prev[sedeActiva] || []), zona] }))
    setMNuevaZona(false)
  }

  const sedeSel = sedes.find(s => s.id === sedeActiva)
  const zonas   = sedeActiva ? (zonasBySede[sedeActiva] || []) : []

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 24px 72px', fontFamily:FF }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
        <button onClick={() => navigate('/operador')} style={{ width:34, height:34, borderRadius:9, background:C.s2, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <ArrowLeft size={16} color={C.muted}/>
        </button>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.text }}>Gestionar zonas</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:2 }}>Selecciona o crea sedes y zonas de parqueo</p>
        </div>
      </div>

      {loading ? <p style={{ color:C.muted, fontSize:14 }}>Cargando…</p> : (
        <>
          {/* SEDES */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              <p style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.1em', textTransform:'uppercase', flex:1 }}>
                Sede{sedes.length !== 1 ? 's' : ''} ({sedes.length})
              </p>
              <button
                onClick={() => setMNuevaSede(true)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:9, background:C.s2, border:`1px solid ${C.border}`, color:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FF }}
              >
                <Plus size={13}/> Nueva sede
              </button>
            </div>

            {sedes.length === 0 ? (
              <div style={{ background:C.surface, border:`1px dashed ${C.border}`, borderRadius:14, padding:'36px 24px', textAlign:'center' }}>
                <MapPin size={36} color={C.border} style={{ marginBottom:14 }}/>
                <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>No hay sedes registradas</p>
                <button onClick={() => setMNuevaSede(true)} style={{ padding:'10px 22px', borderRadius:10, background:GRAD, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FF }}>
                  <Plus size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>Crear primera sede
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {sedes.map(s => (
                  <button key={s.id} onClick={() => setSedeActiva(s.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:10, cursor:'pointer', fontFamily:FF, fontSize:13, fontWeight:600, background:sedeActiva===s.id?GRAD:C.surface, border:`1px solid ${sedeActiva===s.id?'transparent':C.border}`, color:sedeActiva===s.id?'#fff':C.muted, transition:'all .15s' }}>
                    <MapPin size={14}/> {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ZONAS */}
          {sedeSel && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                <p style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.1em', textTransform:'uppercase', flex:1 }}>
                  Zonas — {sedeSel.nombre} ({zonas.length})
                </p>
                <button
                  onClick={() => setMNuevaZona(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, background:GRAD, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FF }}
                >
                  <Plus size={14}/> Nueva zona
                </button>
              </div>

              {loadingZonas ? (
                <p style={{ color:C.muted, fontSize:14 }}>Cargando zonas…</p>
              ) : zonas.length === 0 ? (
                <div style={{ background:C.surface, border:`1px dashed ${C.border}`, borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
                  <ParkingSquare size={40} color={C.border} style={{ marginBottom:14 }}/>
                  <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Esta sede no tiene zonas aún</p>
                  <button onClick={() => setMNuevaZona(true)} style={{ padding:'10px 22px', borderRadius:10, background:GRAD, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FF }}>
                    <Plus size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>Crear primera zona
                  </button>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:16 }}>
                  {zonas.map(zona => (
                    <ZonaCard key={zona.id} zona={zona} onEdit={() => navigate(`/operador/zonas/${zona.id}/editor`)}/>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {mNuevaSede && <ModalNuevaSede onClose={() => setMNuevaSede(false)} onCreada={onSedeCreada}/>}
      {mNuevaZona && <ModalNuevaZona sedeId={sedeActiva} onClose={() => setMNuevaZona(false)} onCreada={onZonaCreada}/>}
    </div>
  )
}