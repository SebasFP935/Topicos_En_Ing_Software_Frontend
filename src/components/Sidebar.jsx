// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, CalendarCheck, BookOpen, LayoutDashboard,
  ParkingSquare, LogOut, Wrench, Map,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const NAV_USUARIO = [
  { to: '/',         Icon: Home,          label: 'Inicio'       },
  { to: '/reservar', Icon: CalendarCheck, label: 'Reservar'     },
  { to: '/reservas', Icon: BookOpen,      label: 'Mis Reservas' },
]

const NAV_ADMIN = [
  { to: '/admin', Icon: LayoutDashboard, label: 'Dashboard' },
]

const NAV_OPERADOR = [
  { to: '/operador',       Icon: Wrench, label: 'Panel Operador', end: true },
  { to: '/operador/zonas', Icon: Map,    label: 'Gestionar Zonas' },
]

function NavItem({ to, Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 12,
        color: isActive ? C.text : C.muted,
        background: isActive
          ? 'linear-gradient(90deg, rgba(0,104,183,.38) 0%, rgba(0,104,183,.15) 100%)'
          : 'transparent',
        border: `1px solid ${isActive ? '#2e78b8' : 'transparent'}`,
        transition: 'all .2s', fontSize: 14, fontWeight: 600,
        fontFamily: FF, textDecoration: 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? C.teal : C.muted} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function NavSection({ label, children }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 14px 6px', fontFamily: FF }}>
        {label}
      </p>
      {children}
    </div>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const user     = auth.user()
  const rol      = user?.rol

  const handleLogout = async () => {
    try {
      await auth.fetchAuth('/api/auth/logout', { method: 'POST', headers: auth.headers() })
    } catch { /* ignorar */ }
    auth.clear()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'linear-gradient(180deg, #052347 0%, #041d3a 100%)',
      borderRight: `1px solid ${C.border}`, display: 'flex',
      flexDirection: 'column', padding: '24px 0',
      position: 'sticky', top: 0, flexShrink: 0,
      boxShadow: '8px 0 26px rgba(0,0,0,.18)',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ParkingSquare size={20} color="#fff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: FF, color: C.text }}>
          NoParking
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', flex: 1 }}>

        {/* Sección usuario — siempre */}
        <NavSection label="General">
          {NAV_USUARIO.map(n => <NavItem key={n.to} {...n} />)}
        </NavSection>

        {/* Sección admin */}
        {rol === 'ADMIN' && (
          <NavSection label="Administración">
            {NAV_ADMIN.map(n => <NavItem key={n.to} {...n} />)}
          </NavSection>
        )}

        {/* Sección operador */}
        {(rol === 'ADMIN' || rol === 'OPERADOR') && (
          <NavSection label="Operador">
            {NAV_OPERADOR.map(n => <NavItem key={n.to} {...n} />)}
          </NavSection>
        )}
      </nav>

      {/* Usuario + Logout */}
      <div style={{ padding: '16px 10px 0', borderTop: `1px solid ${C.border}`, margin: '0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'linear-gradient(180deg, rgba(10,47,92,.92) 0%, rgba(6,35,71,.92) 100%)', marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FF }}>
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre} {user?.apellido}
            </p>
            <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
              {rol === 'ADMIN' ? 'Administrador' : rol === 'OPERADOR' ? 'Operador' : 'Estudiante'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: '#062953', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
