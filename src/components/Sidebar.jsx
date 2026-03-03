import { NavLink } from 'react-router-dom'
import { Home, CalendarCheck, BookOpen, LayoutDashboard, ParkingSquare } from 'lucide-react'
import { C, GRAD } from '../tokens'

const NAV = [
  { to: '/',         Icon: Home,            label: 'Inicio'      },
  { to: '/reservar', Icon: CalendarCheck,   label: 'Reservar'   },
  { to: '/reservas', Icon: BookOpen,        label: 'Mis Reservas'},
  { to: '/admin',    Icon: LayoutDashboard, label: 'Admin'       },
]

export function Sidebar() {
  return (
    <aside style={{ width: 220, minHeight: '100vh', background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'sticky', top: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ParkingSquare size={20} color="#fff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          NoParking
        </span>
      </div>

      {/* Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', flex: 1 }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
            color: isActive ? C.accent : C.muted, background: isActive ? C.accent + '14' : 'transparent',
            transition: 'all .15s', fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
          })}>
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.accent }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ margin: '0 10px', padding: '12px 14px', borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>J</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Josue C.</p>
          <p style={{ fontSize: 11, color: C.muted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Estudiante</p>
        </div>
      </div>
    </aside>
  )
}
