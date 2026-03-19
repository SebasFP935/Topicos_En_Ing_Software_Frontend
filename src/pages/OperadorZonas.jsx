// src/pages/OperadorZonas.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ParkingSquare, Edit3, ChevronRight, Plus, X, Building2 } from 'lucide-react'
import { C, GRAD, MAIN_TITLE_SIZE } from '../tokens'
import { auth } from '../utils/auth'

const FF = 'var(--ff-apple)'
const TIPOS_ZONA = ['CUBIERTO', 'DESCUBIERTO', 'TECHADO']
const TIPO_COLOR = { CUBIERTO: '#ff4d6d', DESCUBIERTO: '#7ba5ff', TECHADO: '#ff6b88' }

const glassCard = {
  border: '1px solid rgba(255,255,255,.11)',
  background: 'linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.02) 44%, rgba(255,255,255,.01)), #07090d',
  boxShadow: '0 18px 42px rgba(0,0,0,.36)',
  backdropFilter: 'blur(10px)',
}
const SOFT_ACTIVE_BG = 'linear-gradient(138deg, rgba(255,77,109,.26) 0%, rgba(123,165,255,.22) 100%), #121722'
const SOFT_ACTIVE_BORDER = 'rgba(132,168,255,.52)'
const SOFT_ACTIVE_TEXT = '#f4f7ff'
const SOFT_ACTIVE_SHADOW = 'inset 0 1px 0 rgba(255,255,255,.09), 0 10px 24px rgba(0,0,0,.34)'

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...glassCard,
          width: '100%',
          maxWidth: 520,
          borderRadius: 24,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 26, fontWeight: 810, color: C.text, fontFamily: FF, letterSpacing: '-.02em' }}>{title}</p>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border}`, cursor: 'pointer', color: C.muted, display: 'grid', placeItems: 'center' }}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputSt = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 13,
  background: 'rgba(255,255,255,.03)',
  border: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 15,
  fontFamily: FF,
  boxSizing: 'border-box',
  outline: 'none',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, fontFamily: FF, marginBottom: 7, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
      {children}
    </div>
  )
}

function ModalNuevaSede({ onClose, onCreada }) {
  const [form, setForm] = useState({ nombre: '', direccion: '', latitud: '', longitud: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError('')
    try {
      const res = await auth.fetchAuth('/api/sedes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim() || null,
          latitud: form.latitud ? parseFloat(form.latitud) : null,
          longitud: form.longitud ? parseFloat(form.longitud) : null,
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
      {error && <div style={{ background: '#ff4d6d14', border: '1px solid #ff4d6d40', borderRadius: 12, padding: '10px 13px', marginBottom: 15, color: '#ff6a84', fontSize: 13, fontFamily: FF }}>{error}</div>}
      <Field label="Nombre *">
        <input autoFocus style={inputSt} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} placeholder="Ej. Sede Central UPB" />
      </Field>
      <Field label="Direccion">
        <input style={inputSt} value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Ej. Av. Villazon 1234" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Latitud">
          <input style={inputSt} type="number" step="any" value={form.latitud} onChange={(e) => set('latitud', e.target.value)} placeholder="-16.5..." />
        </Field>
        <Field label="Longitud">
          <input style={inputSt} type="number" step="any" value={form.longitud} onChange={(e) => set('longitud', e.target.value)} placeholder="-68.1..." />
        </Field>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '13px 0',
          borderRadius: 14,
          background: saving ? C.border : GRAD,
          border: 'none',
          color: '#fff',
          fontSize: 15,
          fontWeight: 760,
          cursor: saving ? 'default' : 'pointer',
          fontFamily: FF,
        }}
      >{saving ? 'Guardando...' : 'Crear sede'}</button>
    </Modal>
  )
}

function ModalNuevaZona({ sedeId, onClose, onCreada }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'DESCUBIERTO' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError('')
    try {
      const res = await auth.fetchAuth('/api/zonas', {
        method: 'POST',
        body: JSON.stringify({
          sedeId,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          tipo: form.tipo,
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
      {error && <div style={{ background: '#ff4d6d14', border: '1px solid #ff4d6d40', borderRadius: 12, padding: '10px 13px', marginBottom: 15, color: '#ff6a84', fontSize: 13, fontFamily: FF }}>{error}</div>}
      <Field label="Nombre *">
        <input autoFocus style={inputSt} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} placeholder="Ej. Planta Baja" />
      </Field>
      <Field label="Descripcion">
        <input style={inputSt} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Ej. Zona A - acceso porton norte" />
      </Field>
      <Field label="Tipo de zona">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {TIPOS_ZONA.map((t) => {
            const color = TIPO_COLOR[t]
            const active = form.tipo === t
            return (
              <button key={t} onClick={() => set('tipo', t)} style={{ padding: '9px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: FF, fontSize: 13, fontWeight: 720, background: active ? color + '1f' : 'rgba(255,255,255,.02)', border: `1px solid ${active ? color : C.border}`, color: active ? color : C.muted }}>
                {t}
              </button>
            )
          })}
        </div>
      </Field>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '13px 0',
          borderRadius: 14,
          background: saving ? C.border : GRAD,
          border: 'none',
          color: '#fff',
          fontSize: 15,
          fontWeight: 760,
          cursor: saving ? 'default' : 'pointer',
          fontFamily: FF,
        }}
      >{saving ? 'Guardando...' : 'Crear zona'}</button>
    </Modal>
  )
}

function ZonaCard({ zona, onEdit }) {
  const color = TIPO_COLOR[zona.tipo] || C.accent
  return (
    <div
      onClick={onEdit}
      style={{
        ...glassCard,
        borderRadius: 22,
        padding: '22px',
        cursor: 'pointer',
        transition: 'border-color .15s, transform .12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.11)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 15, background: color + '1c', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ParkingSquare size={24} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 760, color, background: color + '14', border: `1px solid ${color}40`, borderRadius: 100, padding: '4px 11px', fontFamily: FF }}>{zona.tipo}</span>
      </div>
      <p style={{ fontSize: 21, fontWeight: 810, color: C.text, fontFamily: FF, marginBottom: 6, letterSpacing: '-.02em' }}>{zona.nombre}</p>
      {zona.descripcion && <p style={{ fontSize: 13.5, color: C.muted, fontFamily: FF, marginBottom: 14, lineHeight: 1.45 }}>{zona.descripcion}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <Edit3 size={15} color={color} />
        <span style={{ fontSize: 13.5, fontWeight: 720, color, fontFamily: FF }}>Editar plano</span>
        <ChevronRight size={17} color={C.muted} style={{ marginLeft: 'auto' }} />
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
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setSedes(data); if (data.length > 0) setSedeActiva(data[0].id) })
      .catch(() => setSedes([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!sedeActiva || zonasBySede[sedeActiva] !== undefined) return
    setLoadingZonas(true)
    auth.fetchAuth(`/api/zonas/sede/${sedeActiva}`)
      .then((r) => r.ok ? r.json() : [])
      .then((zonas) => setZonasBySede((prev) => ({ ...prev, [sedeActiva]: zonas })))
      .catch(() => setZonasBySede((prev) => ({ ...prev, [sedeActiva]: [] })))
      .finally(() => setLoadingZonas(false))
  }, [sedeActiva, zonasBySede])

  const onSedeCreada = (sede) => {
    setSedes((prev) => [...prev, sede])
    setSedeActiva(sede.id)
    setMNuevaSede(false)
  }

  const onZonaCreada = (zona) => {
    setZonasBySede((prev) => ({ ...prev, [sedeActiva]: [...(prev[sedeActiva] || []), zona] }))
    setMNuevaZona(false)
  }

  const sedeSel = sedes.find((s) => s.id === sedeActiva)
  const zonas = sedeActiva ? (zonasBySede[sedeActiva] || []) : []

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 72px', fontFamily: FF }}>
      <div style={{ borderRadius: 28, border: `1px solid ${C.border}`, background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 45%, rgba(255,255,255,.01)), #07090d', padding: '28px 22px 30px', boxShadow: '0 22px 52px rgba(0,0,0,.36)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
        <button onClick={() => navigate('/operador')} style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={C.muted} />
        </button>
        <div>
          <h1 style={{ fontSize: MAIN_TITLE_SIZE, fontWeight: 820, color: C.text, letterSpacing: '-.03em' }}>Gestionar zonas</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 3 }}>Crea sedes y zonas con una vista mas clara y profesional.</p>
        </div>
      </div>

      {loading ? <p style={{ color: C.muted, fontSize: 15 }}>Cargando...</p> : (
        <>
          <div style={{ ...glassCard, borderRadius: 24, padding: '18px 18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 11, fontWeight: 760, color: C.muted, letterSpacing: '.14em', textTransform: 'uppercase', flex: 1 }}>
                Sedes ({sedes.length})
              </p>
              <button
                onClick={() => setMNuevaSede(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, background: GRAD, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}
              >
                <Plus size={15} /> Nueva sede
              </button>
            </div>

            {sedes.length === 0 ? (
              <div style={{ border: `1px dashed ${C.border}`, borderRadius: 18, padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,.015)' }}>
                <Building2 size={44} color={C.border} style={{ marginBottom: 14 }} />
                <p style={{ color: C.muted, fontSize: 15, marginBottom: 18 }}>No hay sedes registradas</p>
                <button onClick={() => setMNuevaSede(true)} style={{ padding: '11px 24px', borderRadius: 12, background: GRAD, border: 'none', color: '#fff', fontSize: 14, fontWeight: 740, cursor: 'pointer', fontFamily: FF }}>
                  <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Crear primera sede
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {sedes.map((s) => (
                  <button key={s.id} onClick={() => setSedeActiva(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 13, cursor: 'pointer', fontFamily: FF, fontSize: 14, fontWeight: 680, background: sedeActiva === s.id ? SOFT_ACTIVE_BG : 'rgba(255,255,255,.02)', border: `1px solid ${sedeActiva === s.id ? SOFT_ACTIVE_BORDER : C.border}`, color: sedeActiva === s.id ? SOFT_ACTIVE_TEXT : C.text, boxShadow: sedeActiva === s.id ? SOFT_ACTIVE_SHADOW : 'none', transition: 'all .15s' }}>
                    <MapPin size={15} /> {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {sedeSel && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 11, fontWeight: 760, color: C.muted, letterSpacing: '.14em', textTransform: 'uppercase', flex: 1 }}>
                  Zonas - {sedeSel.nombre} ({zonas.length})
                </p>
                <button
                  onClick={() => setMNuevaZona(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, background: GRAD, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 740, cursor: 'pointer', fontFamily: FF }}
                >
                  <Plus size={15} /> Nueva zona
                </button>
              </div>

              {loadingZonas ? (
                <p style={{ color: C.muted, fontSize: 15 }}>Cargando zonas...</p>
              ) : zonas.length === 0 ? (
                <div style={{ ...glassCard, borderRadius: 22, padding: '48px 24px', textAlign: 'center' }}>
                  <ParkingSquare size={44} color={C.border} style={{ marginBottom: 14 }} />
                  <p style={{ color: C.muted, fontSize: 15, marginBottom: 20 }}>Esta sede no tiene zonas aun</p>
                  <button onClick={() => setMNuevaZona(true)} style={{ padding: '11px 24px', borderRadius: 12, background: GRAD, border: 'none', color: '#fff', fontSize: 14, fontWeight: 740, cursor: 'pointer', fontFamily: FF }}>
                    <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Crear primera zona
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {zonas.map((zona) => (
                    <ZonaCard key={zona.id} zona={zona} onEdit={() => navigate(`/operador/zonas/${zona.id}/editor`)} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      </div>

      {mNuevaSede && <ModalNuevaSede onClose={() => setMNuevaSede(false)} onCreada={onSedeCreada} />}
      {mNuevaZona && <ModalNuevaZona sedeId={sedeActiva} onClose={() => setMNuevaZona(false)} onCreada={onZonaCreada} />}
    </div>
  )
}
