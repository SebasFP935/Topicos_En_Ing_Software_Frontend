import { useEffect, useState } from 'react'
import {
  BarChart2, CalendarCheck, Users, Activity,
  CheckCircle, XCircle, Clock, RefreshCw,
  ParkingSquare, UserCheck, AlertCircle, Search
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

/* ── helpers ── */
const fmtHora = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}
const fmtFecha = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
}
const initials = name => name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const ESTADO_META = {
  ACTIVA:     { label: 'Activa',     color: '#3de8c8', bg: '#3de8c814' },
  COMPLETADA: { label: 'Completada', color: '#5b7eff', bg: '#5b7eff14' },
  CANCELADA:  { label: 'Cancelada',  color: '#ff4d6d', bg: '#ff4d6d14' },
  NO_SHOW:    { label: 'No show',    color: '#ffaa00', bg: '#ffaa0014' },
}

/* ── Badge de estado ── */
function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] || { label: estado, color: C.muted, bg: '#ffffff10' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, fontFamily: FF,
      color: m.color, background: m.bg,
      border: `1px solid ${m.color}30`,
      borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap'
    }}>{m.label}</span>
  )
}

/* ── KPI card ── */
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

export default function AdminDashboard() {
  const [kpis, setKpis]       = useState(null)
  const [reservas, setReservas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [loadingRes, setLoadingRes]   = useState(true)
  const [loadingUsu, setLoadingUsu]   = useState(true)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('reservas') // 'reservas' | 'usuarios'
  const [error, setError]     = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const cargarDatos = async () => {
    setError(null)
    // KPIs
    setLoadingKpis(true)
    try {
      const r = await auth.fetchAuth('/api/admin/dashboard')
      if (!r.ok) throw new Error('Error al cargar métricas')
      setKpis(await r.json())
    } catch (e) { setError(e.message) }
    finally { setLoadingKpis(false) }

    // Reservas de hoy
    setLoadingRes(true)
    try {
      const r = await auth.fetchAuth('/api/admin/reservas/hoy')
      if (!r.ok) throw new Error()
      setReservas(await r.json())
    } catch { setReservas([]) }
    finally { setLoadingRes(false) }

    // Usuarios (estudiantes)
    setLoadingUsu(true)
    try {
      const r = await auth.fetchAuth('/api/admin/usuarios/estudiantes')
      if (!r.ok) throw new Error()
      setUsuarios(await r.json())
    } catch { setUsuarios([]) }
    finally { setLoadingUsu(false) }

    setLastUpdate(new Date())
  }

  useEffect(() => { cargarDatos() }, [])

  /* ── filtro de búsqueda ── */
  const reservasFiltradas = reservas.filter(r =>
    !search ||
    r.usuarioNombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.codigoEspacio?.toLowerCase().includes(search.toLowerCase()) ||
    r.zonaNombre?.toLowerCase().includes(search.toLowerCase())
  )
  const usuariosFiltrados = usuarios.filter(u =>
    !search ||
    `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── ocupación aproximada ── */
  const activas = reservas.filter(r => r.estado === 'ACTIVA').length
  const completadas = reservas.filter(r => r.estado === 'COMPLETADA').length
  const canceladas  = reservas.filter(r => r.estado === 'CANCELADA').length

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
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3de8c8' }}>En vivo</span>
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
        <KpiCard label="Reservas hoy"    value={kpis?.reservasHoy}     sub={`${activas} activas ahora`}  color="#5b7eff" Icon={CalendarCheck} loading={loadingKpis} />
        <KpiCard label="Total usuarios"  value={kpis?.totalUsuarios}   sub="Registrados en el sistema"   color="#a259ff" Icon={Users}         loading={loadingKpis} />
        <KpiCard label="Operadores"      value={kpis?.totalOperadores} sub="Con acceso al sistema"        color="#ffaa00" Icon={UserCheck}     loading={loadingKpis} />
        <KpiCard label="Completadas hoy" value={completadas}            sub={`${canceladas} canceladas`}  color="#3de8c8" Icon={CheckCircle}   loading={loadingRes}  />
      </div>

      {/* ── Distribución estados ── */}
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
          {/* Barra visual */}
          {reservas.length > 0 && (
            <div style={{ display: 'flex', height: 8, borderRadius: 100, overflow: 'hidden', marginTop: 14, gap: 2 }}>
              {[
                { val: activas,    color: '#3de8c8' },
                { val: completadas, color: '#5b7eff' },
                { val: canceladas,  color: '#ff4d6d' },
              ].filter(s => s.val > 0).map((s, i) => (
                <div key={i} style={{ flex: s.val, background: s.color, borderRadius: 100 }} />
              ))}
            </div>
          )}
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
              onClick={() => { setTab(t.id); setSearch('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: tab === t.id ? GRAD : 'transparent',
                border: 'none', color: tab === t.id ? '#fff' : C.muted,
                borderRadius: 9, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF,
                transition: 'all .2s'
              }}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
          <Search size={14} color={C.muted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'reservas' ? 'Buscar usuario, espacio...' : 'Buscar usuario...'}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: FF, width: 200 }}
          />
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
              <p style={{ color: C.muted, fontSize: 14 }}>
                {search ? 'Sin resultados para esa búsqueda' : 'No hay reservas para hoy'}
              </p>
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
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: FF }}>
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
                        : <span style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>Pendiente</span>
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
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loadingUsu ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Cargando usuarios...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ color: C.muted, fontSize: 14 }}>
                {search ? 'Sin resultados' : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Usuario', 'Email', 'Vehículo', 'Teléfono', 'Estado'].map(h => (
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
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: FF }}>
                          {initials(`${u.nombre} ${u.apellido}`)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{u.nombre} {u.apellido}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>{u.email}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {u.vehiculoPlaca
                        ? <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FF }}>{u.vehiculoPlaca}</p>
                            <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{u.vehiculoModelo || '—'}</p>
                          </div>
                        : <span style={{ fontSize: 12, color: C.muted }}>Sin vehículo</span>
                      }
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>{u.telefono || '—'}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 100, padding: '3px 10px',
                        color:       u.activo ? '#3de8c8' : '#ff4d6d',
                        background:  u.activo ? '#3de8c814' : '#ff4d6d14',
                        border:     `1px solid ${u.activo ? '#3de8c830' : '#ff4d6d30'}`,
                        fontFamily: FF
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

    </div>
  )
}