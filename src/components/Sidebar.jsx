// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, CalendarCheck, BookOpen, LayoutDashboard, ParkingSquare, LogOut } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const NAV = [
  { to: '/',         Icon: Home,            label: 'Inicio'       },
  { to: '/reservar', Icon: CalendarCheck,   label: 'Reservar'     },
  { to: '/reservas', Icon: BookOpen,        label: 'Mis Reservas' },
  { to: '/admin',    Icon: LayoutDashboard, label: 'Admin', adminOnly: true },
]

export function Sidebar() {
  const navigate = useNavigate()
  const user     = auth.user()
  const isAdmin  = auth.isAdmin()

  const handleLogout = async () => {
    try {
      await auth.fetchAuth('/api/auth/logout', {
        method: 'POST',
        headers: auth.headers(),
      })
    } catch { /* ignorar error de red */ }
    auth.clear()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: C.surface,
      borderRight: `1px solid ${C.border}`, display: 'flex',
      flexDirection: 'column', padding: '24px 0',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: GRAD,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ParkingSquare size={20} color="#fff" />
        </div>
        <span style={{
          fontSize: 18, fontWeight: 800, fontFamily: FF,
          background: GRAD, WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>NoParking</span>
      </div>

      {/* Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', flex: 1 }}>
        {NAV.filter(n => !n.adminOnly || isAdmin).map(({ to, Icon, label }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              color: isActive ? C.accent : C.muted,
              background: isActive ? C.accent + '14' : 'transparent',
              transition: 'all .15s', fontSize: 14, fontWeight: 600,
              fontFamily: FF, textDecoration: 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + Logout */}
      <div style={{ padding: '16px 10px 0', borderTop: `1px solid ${C.border}`, margin: '0 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: C.s2, marginBottom: 6,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: GRAD, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FF,
          }}>
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre} {user?.apellido}
            </p>
            <p style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
              {user?.rol === 'ADMIN' ? 'Administrador' : user?.rol === 'OPERADOR' ? 'Operador' : 'Estudiante'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: FF,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}