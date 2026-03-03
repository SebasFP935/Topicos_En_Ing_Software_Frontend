import { NavLink } from 'react-router-dom'
import { Home, CalendarCheck, BookOpen, LayoutDashboard } from 'lucide-react'
import { C } from '../tokens'

const NAV = [
  { to: '/',         Icon: Home,            label: 'Inicio'   },
  { to: '/reservar', Icon: CalendarCheck,   label: 'Reservar' },
  { to: '/reservas', Icon: BookOpen,        label: 'Reservas' },
  { to: '/admin',    Icon: LayoutDashboard, label: 'Admin'    },
]

export function BottomNav() {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', paddingBottom: 8, paddingTop: 8, zIndex: 100 }}>
      {NAV.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: isActive ? C.accent : C.muted, transition: 'color .15s', padding: '4px 0',
        })}>
          {({ isActive }) => (
            <>
              <div style={{ width: 36, height: 28, borderRadius: 10, background: isActive ? C.accent + '18' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
