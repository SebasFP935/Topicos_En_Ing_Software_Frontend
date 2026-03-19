// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, CalendarCheck, BookOpen, LayoutDashboard,
  ParkingSquare, LogOut, Wrench, Map,
} from 'lucide-react'
import { C, GRAD, FF } from '../tokens'
import { auth } from '../utils/auth'

const NAV_USUARIO = [
  { to: '/',         Icon: Home,          label: 'Inicio' },
  { to: '/reservar', Icon: CalendarCheck, label: 'Reservar' },
  { to: '/reservas', Icon: BookOpen,      label: 'Mis Reservas' },
]

const NAV_ADMIN = [
  { to: '/admin', Icon: LayoutDashboard, label: 'Dashboard' },
]

const NAV_OPERADOR = [
  { to: '/operador',       Icon: Wrench, label: 'Panel Operador' },
  { to: '/operador/zonas', Icon: Map,    label: 'Gestionar Zonas' },
]

function NavItem({ to, Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 16,
        color: isActive ? '#ffe7ec' : C.muted,
        background: isActive
          ? 'linear-gradient(125deg, rgba(255,77,109,.25), rgba(255,77,109,.1) 46%, rgba(123,165,255,.16))'
          : 'rgba(255,255,255,.015)',
        border: `1px solid ${isActive ? 'rgba(255,77,109,.55)' : 'rgba(255,255,255,.05)'}`,
        boxShadow: isActive ? '0 10px 24px rgba(0,0,0,.28)' : 'none',
        transition: 'all .18s',
        fontSize: 15,
        fontWeight: 650,
        letterSpacing: '.01em',
        fontFamily: FF,
        textDecoration: 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function NavSection({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 10.5, fontWeight: 760, color: '#ff8aa0', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 14px 11px', fontFamily: FF }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {children}
      </div>
    </div>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const user = auth.user()
  const rol = user?.rol

  const handleLogout = async () => {
    try {
      await auth.fetchAuth('/api/auth/logout', { method: 'POST', headers: auth.headers() })
    } catch { /* ignore */ }
    auth.clear()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 284,
      minHeight: '100vh',
      background: 'radial-gradient(circle at 5% 0%, rgba(255,77,109,.16), transparent 26%), radial-gradient(circle at 96% 6%, rgba(123,165,255,.12), transparent 24%), linear-gradient(180deg, rgba(5,8,12,.98), rgba(7,10,15,.9))',
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 12px 14px',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      backdropFilter: 'blur(10px)',
      boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06)',
    }}>
      <div style={{ padding: '4px 12px 20px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 26px rgba(255,77,109,.30)' }}>
          <ParkingSquare size={22} color="#fff" />
        </div>
        <span style={{ fontSize: 22, fontWeight: 820, fontFamily: FF, color: '#ffdce3', letterSpacing: '-.02em' }}>
          NoParking
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 8px', flex: 1 }}>
        <NavSection label="General">
          {NAV_USUARIO.map((n) => <NavItem key={n.to} {...n} />)}
        </NavSection>

        {rol === 'ADMIN' && (
          <NavSection label="Administracion">
            {NAV_ADMIN.map((n) => <NavItem key={n.to} {...n} />)}
          </NavSection>
        )}

        {(rol === 'ADMIN' || rol === 'OPERADOR') && (
          <NavSection label="Operador">
            {NAV_OPERADOR.map((n) => <NavItem key={n.to} {...n} />)}
          </NavSection>
        )}
      </nav>

      <div style={{ padding: '16px 8px 0', borderTop: `1px solid ${C.border}`, margin: '0 6px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 13px',
          borderRadius: 16,
          background: 'linear-gradient(140deg, rgba(255,255,255,.07), rgba(255,255,255,.02) 44%, rgba(255,255,255,.01))',
          border: `1px solid ${C.border}`,
          marginBottom: 10,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 750, color: '#fff', fontFamily: FF }}>
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 14, fontWeight: 720, color: C.text, fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre} {user?.apellido}
            </p>
            <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>
              {rol === 'ADMIN' ? 'Administrador' : rol === 'OPERADOR' ? 'Operador' : 'Estudiante'}
            </p>
          </div>
        </div>

        <button onClick={handleLogout} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 620, cursor: 'pointer', fontFamily: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={17} /> Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
