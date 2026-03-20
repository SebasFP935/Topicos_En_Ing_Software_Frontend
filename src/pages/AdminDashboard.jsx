// src/pages/AdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react'
import {
  BarChart2, CalendarCheck, Users, Activity,
  CheckCircle, XCircle, Clock, RefreshCw,
  ParkingSquare, UserCheck, AlertCircle, Search,
  X, Pencil, ShieldCheck, UserCog, Save, ChevronDown,
  ToggleLeft, ToggleRight, AlertTriangle,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { auth } from '../utils/auth'
import { trackEvent } from '../utils/analytics'

const FF = "'Plus Jakarta Sans', sans-serif"

/* ── helpers ─────────────────────────────────────────────────────── */
const fmtHora  = iso => iso ? new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'
const fmtFecha = iso => iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }) : '—'
const initials = name => name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const ESTADO_META = {
  ACTIVA:     { label: 'Activa',     color: '#3de8c8', bg: '#3de8c814' },
  COMPLETADA: { label: 'Completada', color: '#5b7eff', bg: '#5b7eff14' },
  CANCELADA:  { label: 'Cancelada',  color: '#ff4d6d', bg: '#ff4d6d14' },
  NO_SHOW:    { label: 'No show',    color: '#ffaa00', bg: '#ffaa0014' },
}

const ROL_META = {
  USUARIO:  { label: 'Usuario',  color: '#5b7eff', bg: '#5b7eff14' },
  OPERADOR: { label: 'Operador', color: '#ffaa00', bg: '#ffaa0014' },
}

const TIPO_DOC_OPTS = ['CI', 'PASAPORTE', 'CARNET_EXTRANJERO']

/* ── sub-components ───────────────────────────────────────────────── */
function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] || { label: estado, color: C.muted, bg: '#ffffff10' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, fontFamily: FF,
      color: m.color, background: m.bg,
      border: `1px solid ${m.color}30`,
      borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>{m.label}</span>
  )
}

function RolBadge({ rol }) {
  const m = ROL_META[rol] || { label: rol, color: C.muted, bg: '#ffffff10' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, fontFamily: FF,
      color: m.color, background: m.bg,
      border: `1px solid ${m.color}30`,
      borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>{m.label}</span>
  )
}

function KpiCard({ label, value, sub, color, Icon, loading }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: FF, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      {loading
        ? <div style={{ height: 36, background: C.border, borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        : <p style={{ fontSize: 34, fontWeight: 800, color: C.text, fontFamily: FF, lineHeight: 1 }}>{value ?? '—'}</p>
      }
      {sub && !loading && <p style={{ fontSize: 12, color: C.muted, marginTop: 6, fontFamily: FF }}>{sub}</p>}
    </Card>
  )
}

/* ── input helper ─────────────────────────────────────────────────── */
const inputSt = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  background: C.s2, border: `1px solid ${C.border}`,
  color: C.text, fontSize: 13, fontFamily: FF,
  boxSizing: 'border-box', outline: 'none',
}

/* ── Modal de edición de usuario ──────────────────────────────────── */
function ModalEditarUsuario({ usuario, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:          usuario.nombre         || '',
    apellido:        usuario.apellido       || '',
    email:           usuario.email          || '',
    telefono:        usuario.telefono       || '',
    tipoDocumento:   usuario.tipoDocumento  || '',
    numeroDocumento: usuario.numeroDocumento|| '',
    vehiculoPlaca:   usuario.vehiculoPlaca  || '',
    vehiculoModelo:  usuario.vehiculoModelo || '',
    activo:          usuario.activo ?? true,
  })
  const [rolSeleccionado, setRolSeleccionado] = useState(usuario.rol)
  const [saving,    setSaving]    = useState(false)
  const [feedback,  setFeedback]  = useState(null) // { tipo: 'ok'|'err', msg }
  const [seccion,   setSeccion]   = useState('info') // 'info' | 'rol'

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleGuardar = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      // 1. Actualizar atributos generales
      const body = {}
      if (form.nombre          !== (usuario.nombre         || '')) body.nombre          = form.nombre
      if (form.apellido        !== (usuario.apellido       || '')) body.apellido        = form.apellido
      if (form.email           !== (usuario.email          || '')) body.email           = form.email
      if (form.telefono        !== (usuario.telefono       || '')) body.telefono        = form.telefono
      if (form.tipoDocumento   !== (usuario.tipoDocumento  || '')) body.tipoDocumento   = form.tipoDocumento || null
      if (form.numeroDocumento !== (usuario.numeroDocumento|| '')) body.numeroDocumento = form.numeroDocumento
      if (form.vehiculoPlaca   !== (usuario.vehiculoPlaca  || '')) body.vehiculoPlaca   = form.vehiculoPlaca
      if (form.vehiculoModelo  !== (usuario.vehiculoModelo || '')) body.vehiculoModelo  = form.vehiculoModelo
      if (form.activo          !== (usuario.activo ?? true))       body.activo          = form.activo

      if (Object.keys(body).length > 0) {
        const r = await auth.fetchAuth(`/api/usuarios/${usuario.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.mensaje || 'Error al actualizar datos')
        }
      }

      // 2. Cambio de rol si fue modificado
      if (rolSeleccionado !== usuario.rol) {
        const rr = await auth.fetchAuth(`/api/usuarios/${usuario.id}/rol`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rol: rolSeleccionado }),
        })
        if (!rr.ok) {
          const err = await rr.json().catch(() => ({}))
          throw new Error(err.mensaje || 'Error al cambiar rol')
        }
      }

      setFeedback({ tipo: 'ok', msg: 'Cambios guardados correctamente.' })
      setTimeout(() => { onSaved(); onClose() }, 900)
    } catch (e) {
      setFeedback({ tipo: 'err', msg: e.message })
    } finally {
      setSaving(false)
    }
  }

  const rolCambio = rolSeleccionado !== usuario.rol

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: FF,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, width: '100%', maxWidth: 540,
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', overflow: 'hidden',
        }}
      >
        {/* ── Header del modal ── */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials(`${usuario.nombre} ${usuario.apellido}`)}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{usuario.nombre} {usuario.apellido}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{usuario.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs info / rol ── */}
        <div style={{ padding: '16px 24px 0', display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {[
            { id: 'info', label: 'Datos personales', Icon: UserCog },
            { id: 'rol',  label: 'Rol y acceso',     Icon: ShieldCheck },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSeccion(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                background: 'none', border: 'none',
                borderBottom: seccion === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
                color: seccion === t.id ? C.accent : C.muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF,
                marginBottom: -1, transition: 'color .15s',
              }}
            >
              <t.Icon size={14} /> {t.label}
              {t.id === 'rol' && rolCambio && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffaa00', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Cuerpo scrollable ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* ─ Sección: datos personales ─ */}
          {seccion === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Nombre</p>
                  <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputSt} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Apellido</p>
                  <input value={form.apellido} onChange={e => set('apellido', e.target.value)} style={inputSt} />
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Email</p>
                <input value={form.email} onChange={e => set('email', e.target.value)} style={inputSt} type="email" />
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Teléfono</p>
                <input value={form.telefono} onChange={e => set('telefono', e.target.value)} style={inputSt} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Tipo documento</p>
                  <select
                    value={form.tipoDocumento}
                    onChange={e => set('tipoDocumento', e.target.value)}
                    style={{ ...inputSt, appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">— Sin especificar —</option>
                    {TIPO_DOC_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Número documento</p>
                  <input value={form.numeroDocumento} onChange={e => set('numeroDocumento', e.target.value)} style={inputSt} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Placa vehículo</p>
                  <input value={form.vehiculoPlaca} onChange={e => set('vehiculoPlaca', e.target.value.toUpperCase())} style={inputSt} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Modelo vehículo</p>
                  <input value={form.vehiculoModelo} onChange={e => set('vehiculoModelo', e.target.value)} style={inputSt} />
                </div>
              </div>

              {/* Toggle activo/inactivo */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12,
                  background: C.s2, border: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Cuenta activa</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {form.activo ? 'El usuario puede iniciar sesión' : 'El usuario no puede acceder al sistema'}
                  </p>
                </div>
                <button
                  onClick={() => set('activo', !form.activo)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.activo ? '#3de8c8' : C.muted, display: 'flex', padding: 4 }}
                >
                  {form.activo
                    ? <ToggleRight size={34} strokeWidth={1.5} />
                    : <ToggleLeft  size={34} strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>
          )}

          {/* ─ Sección: rol y acceso ─ */}
          {seccion === 'rol' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                Selecciona el rol que tendrá este usuario en el sistema. Los operadores tienen acceso al panel de operaciones, check-in/out y gestión de mapas.
              </p>

              {/* Tarjetas de rol */}
              {[
                {
                  id: 'USUARIO',
                  title: 'Usuario estándar',
                  desc: 'Puede reservar espacios y ver su historial. Sin acceso al panel de operaciones.',
                  Icon: Users,
                  color: '#5b7eff',
                },
                {
                  id: 'OPERADOR',
                  title: 'Operador',
                  desc: 'Accede al panel de operaciones, gestiona check-in/out y edita mapas de zonas.',
                  Icon: UserCheck,
                  color: '#ffaa00',
                },
              ].map(r => {
                const active = rolSeleccionado === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setRolSeleccionado(r.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '16px 18px', borderRadius: 14, textAlign: 'left',
                      cursor: 'pointer', fontFamily: FF, width: '100%',
                      background: active ? r.color + '12' : C.s2,
                      border: `1.5px solid ${active ? r.color + '60' : C.border}`,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: r.color + (active ? '22' : '14'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <r.Icon size={18} color={r.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? r.color : C.text }}>{r.title}</p>
                        {usuario.rol === r.id && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.border, borderRadius: 100, padding: '2px 8px' }}>
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{r.desc}</p>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: `2px solid ${active ? r.color : C.border}`,
                      background: active ? r.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s',
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                )
              })}

              {/* Aviso de cambio pendiente */}
              {rolCambio && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: '#ffaa0012', border: '1px solid #ffaa0030',
                }}>
                  <AlertTriangle size={14} color="#ffaa00" />
                  <p style={{ fontSize: 12, color: '#ffaa00', fontFamily: FF }}>
                    El rol cambiará de <strong>{usuario.rol}</strong> a <strong>{rolSeleccionado}</strong> al guardar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer del modal ── */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
        }}>
          {feedback && (
            <div style={{
              padding: '9px 14px', borderRadius: 9,
              background: feedback.tipo === 'ok' ? '#3de8c814' : '#ff4d6d12',
              border: `1px solid ${feedback.tipo === 'ok' ? '#3de8c830' : '#ff4d6d30'}`,
              color: feedback.tipo === 'ok' ? '#3de8c8' : '#ff4d6d',
              fontSize: 12, fontFamily: FF,
            }}>
              {feedback.msg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 10, fontFamily: FF,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 10, fontFamily: FF,
                background: saving ? C.border : GRAD, border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                transition: 'opacity .15s',
              }}
            >
              <Save size={14} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Componente principal ─────────────────────────────────────────── */
export default function AdminDashboard() {
  const [kpis,       setKpis]       = useState(null)
  const [reservas,   setReservas]   = useState([])
  const [usuarios,   setUsuarios]   = useState([])
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [loadingRes,  setLoadingRes]  = useState(true)
  const [loadingUsu,  setLoadingUsu]  = useState(true)
  const [search,     setSearch]     = useState('')
  const [tab,        setTab]        = useState('reservas') // 'reservas' | 'usuarios'
  const [error,      setError]      = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [modalUsu,   setModalUsu]   = useState(null)  // usuario seleccionado para editar
  const [filtroRol,  setFiltroRol]  = useState('TODOS') // 'TODOS' | 'USUARIO' | 'OPERADOR'

  /* ── carga de datos ── */
  const cargarDatos = useCallback(async () => {
    setError(null)

    setLoadingKpis(true)
    try {
      const r = await auth.fetchAuth('/api/admin/dashboard')
      if (!r.ok) throw new Error('Error al cargar métricas')
      setKpis(await r.json())
    } catch (e) { setError(e.message) }
    finally { setLoadingKpis(false) }

    setLoadingRes(true)
    try {
      const r = await auth.fetchAuth('/api/admin/reservas/hoy')
      if (!r.ok) throw new Error()
      setReservas(await r.json())
    } catch { setReservas([]) }
    finally { setLoadingRes(false) }

    setLoadingUsu(true)
    try {
      const r = await auth.fetchAuth('/api/usuarios/gestion')
      if (!r.ok) throw new Error()
      setUsuarios(await r.json())
    } catch { setUsuarios([]) }
    finally { setLoadingUsu(false) }

    setLastUpdate(new Date())
  }, [])

  useEffect(() => {
  cargarDatos()
  trackEvent('Admin', 'dashboard_visit')
}, [cargarDatos])

  /* ── filtros ── */
  const reservasFiltradas = reservas.filter(r =>
    !search ||
    r.usuarioNombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.codigoEspacio?.toLowerCase().includes(search.toLowerCase()) ||
    r.zonaNombre?.toLowerCase().includes(search.toLowerCase())
  )

  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch = !search ||
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRol = filtroRol === 'TODOS' || u.rol === filtroRol
    return matchSearch && matchRol
  })

  /* ── derivados ── */
  const activas     = reservas.filter(r => r.estado === 'ACTIVA').length
  const completadas = reservas.filter(r => r.estado === 'COMPLETADA').length
  const canceladas  = reservas.filter(r => r.estado === 'CANCELADA').length
  const operadores  = usuarios.filter(u => u.rol === 'OPERADOR').length
  const inactivos   = usuarios.filter(u => !u.activo).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 64px', fontFamily: FF }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}><GradText>Dashboard Admin</GradText></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            Actualizado: {lastUpdate.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={cargarDatos}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FF }}
          >
            <RefreshCw size={13} /> Actualizar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3de8c814', border: '1px solid #3de8c830', borderRadius: 100, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3de8c8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3de8c8', fontFamily: FF }}>En vivo</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ff4d6d14', border: '1px solid #ff4d6d30', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <AlertCircle size={16} color="#ff4d6d" />
          <span style={{ fontSize: 13, color: '#ff4d6d', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <KpiCard label="Reservas hoy"    value={kpis?.reservasHoy}     sub={`${activas} activas ahora`}     color="#5b7eff" Icon={CalendarCheck} loading={loadingKpis} />
        <KpiCard label="Total usuarios"  value={kpis?.totalUsuarios}   sub="Registrados en el sistema"      color="#a259ff" Icon={Users}         loading={loadingKpis} />
        <KpiCard label="Operadores"      value={kpis?.totalOperadores} sub="Con acceso operativo"           color="#ffaa00" Icon={UserCheck}     loading={loadingKpis} />
        <KpiCard label="Completadas hoy" value={completadas}            sub={`${canceladas} canceladas`}    color="#3de8c8" Icon={CheckCircle}   loading={loadingRes}  />
      </div>

      {/* ── Barra de distribución ── */}
      {!loadingRes && reservas.length > 0 && (
        <Card style={{ padding: '16px 20px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <SectionLabel>Distribución del día</SectionLabel>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Activas',     val: activas,     color: '#3de8c8' },
                { label: 'Completadas', val: completadas,  color: '#5b7eff' },
                { label: 'Canceladas',  val: canceladas,   color: '#ff4d6d' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                  <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 100, overflow: 'hidden', marginTop: 14, gap: 2 }}>
            {[
              { val: activas,    color: '#3de8c8' },
              { val: completadas, color: '#5b7eff' },
              { val: canceladas,  color: '#ff4d6d' },
            ].filter(s => s.val > 0).map((s, i) => (
              <div key={i} style={{ flex: s.val, background: s.color, borderRadius: 100 }} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Tabs + búsqueda ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
          {[
            { id: 'reservas', label: `Reservas hoy (${reservas.length})`, Icon: CalendarCheck },
            { id: 'usuarios', label: `Usuarios (${usuarios.length})`,     Icon: Users },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); setFiltroRol('TODOS') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: tab === t.id ? GRAD : 'transparent',
                border: 'none', color: tab === t.id ? '#fff' : C.muted,
                borderRadius: 9, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF,
                transition: 'all .2s',
              }}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filtro de rol — solo visible en tab usuarios */}
          {tab === 'usuarios' && (
            <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
              {['TODOS', 'USUARIO', 'OPERADOR'].map(r => (
                <button
                  key={r}
                  onClick={() => setFiltroRol(r)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: FF, fontSize: 11, fontWeight: 700,
                    background: filtroRol === r
                      ? (r === 'OPERADOR' ? '#ffaa0022' : r === 'USUARIO' ? '#5b7eff22' : C.s2)
                      : 'transparent',
                    color: filtroRol === r
                      ? (r === 'OPERADOR' ? '#ffaa00' : r === 'USUARIO' ? '#5b7eff' : C.text)
                      : C.muted,
                    transition: 'all .15s',
                  }}
                >
                  {r === 'TODOS' ? 'Todos' : r === 'USUARIO' ? 'Usuarios' : 'Operadores'}
                </button>
              ))}
            </div>
          )}

          {/* Búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
            <Search size={14} color={C.muted} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'reservas' ? 'Buscar reserva...' : 'Buscar usuario...'}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: FF, width: 180 }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabla de reservas ── */}
      {tab === 'reservas' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loadingRes ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Cargando reservas...</div>
          ) : reservasFiltradas.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <ParkingSquare size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ color: C.muted, fontSize: 14 }}>{search ? 'Sin resultados' : 'No hay reservas para hoy'}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Usuario', 'Espacio', 'Zona · Sede', 'Horario', 'Check-in', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: C.muted, textAlign: 'left', letterSpacing: '.07em', textTransform: 'uppercase', fontFamily: FF }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservasFiltradas.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: i < reservasFiltradas.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.s2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {initials(r.usuarioNombre)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{r.usuarioNombre}</p>
                          <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{r.usuarioEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FF }}>{r.codigoEspacio}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <p style={{ fontSize: 13, color: C.text, fontFamily: FF }}>{r.zonaNombre}</p>
                      <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{r.sedeNombre}</p>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color={C.muted} />
                        <span style={{ fontSize: 13, color: C.text, fontFamily: FF }}>{fmtHora(r.fechaInicio)} – {fmtHora(r.fechaFin)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {r.checkInTime
                        ? <span style={{ fontSize: 12, color: '#3de8c8', fontWeight: 600, fontFamily: FF }}>✓ {fmtHora(r.checkInTime)}</span>
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <EstadoBadge estado={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Tabla de usuarios ── */}
      {tab === 'usuarios' && (
        <>
          {/* mini-stats del tab */}
          {!loadingUsu && usuarios.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Total',      val: usuarios.length,                    color: C.muted    },
                { label: 'Operadores', val: operadores,                          color: '#ffaa00'  },
                { label: 'Inactivos',  val: inactivos,                           color: '#ff4d6d'  },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '5px 12px' }}>
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: FF }}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {loadingUsu ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Cargando usuarios...</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Users size={40} color={C.border} style={{ marginBottom: 12 }} />
                <p style={{ color: C.muted, fontSize: 14 }}>{search ? 'Sin resultados' : 'No hay usuarios'}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Usuario', 'Email', 'Vehículo', 'Teléfono', 'Rol', 'Estado', ''].map(h => (
                      <th key={h} style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: C.muted, textAlign: 'left', letterSpacing: '.07em', textTransform: 'uppercase', fontFamily: FF }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < usuariosFiltrados.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.s2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Nombre */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            background: u.activo ? GRAD : C.border,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: FF,
                          }}>
                            {initials(`${u.nombre} ${u.apellido}`)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: u.activo ? C.text : C.muted, fontFamily: FF }}>
                              {u.nombre} {u.apellido}
                            </p>
                            {u.numeroDocumento && (
                              <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{u.tipoDocumento} {u.numeroDocumento}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>{u.email}</span>
                      </td>

                      {/* Vehículo */}
                      <td style={{ padding: '14px 18px' }}>
                        {u.vehiculoPlaca ? (
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FF, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 8px' }}>
                              {u.vehiculoPlaca}
                            </span>
                            {u.vehiculoModelo && (
                              <p style={{ fontSize: 11, color: C.muted, fontFamily: FF, marginTop: 3 }}>{u.vehiculoModelo}</p>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>—</span>
                        )}
                      </td>

                      {/* Teléfono */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>{u.telefono || '—'}</span>
                      </td>

                      {/* Rol */}
                      <td style={{ padding: '14px 18px' }}>
                        <RolBadge rol={u.rol} />
                      </td>

                      {/* Estado activo */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: FF,
                          color: u.activo ? '#3de8c8' : '#ff4d6d',
                          background: u.activo ? '#3de8c814' : '#ff4d6d12',
                          border: `1px solid ${u.activo ? '#3de8c830' : '#ff4d6d30'}`,
                          borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
                        }}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => setModalUsu(u)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                            background: 'transparent', color: C.muted, fontSize: 12,
                            fontWeight: 600, cursor: 'pointer', fontFamily: FF,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;  e.currentTarget.style.color = C.muted }}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {/* ── Modal de edición ── */}
      {modalUsu && (
        <ModalEditarUsuario
          usuario={modalUsu}
          onClose={() => setModalUsu(null)}
          onSaved={() => {
            setModalUsu(null)
            // Recargar solo la lista de usuarios
            setLoadingUsu(true)
            auth.fetchAuth('/api/usuarios/gestion')
              .then(r => r.ok ? r.json() : [])
              .then(data => setUsuarios(Array.isArray(data) ? data : []))
              .catch(() => {})
              .finally(() => setLoadingUsu(false))
          }}
        />
      )}
    </div>
  )
}