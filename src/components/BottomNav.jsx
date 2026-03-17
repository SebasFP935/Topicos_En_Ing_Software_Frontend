// src/components/BottomNav.jsx
import { NavLink } from 'react-router-dom'
import { Home, CalendarCheck, BookOpen, LayoutDashboard, Wrench } from 'lucide-react'
import { C } from '../tokens'
import { auth } from '../utils/auth'

const NAV_USUARIO = [
  { to: '/',         Icon: Home,            label: 'Inicio'   },
  { to: '/reservar', Icon: CalendarCheck,   label: 'Reservar' },
  { to: '/reservas', Icon: BookOpen,        label: 'Reservas' },
]

const NAV_ADMIN_EXTRA = [
  { to: '/admin', Icon: LayoutDashboard, label: 'Admin' },
]

const NAV_OPERADOR_EXTRA = [
  { to: '/operador', Icon: Wrench, label: 'Operador' },
]

export function BottomNav() {
  const rol = auth.user()?.rol

  const items = [
    ...NAV_USUARIO,
    ...(rol === 'ADMIN'                    ? NAV_ADMIN_EXTRA    : []),
    ...(rol === 'OPERADOR' || rol === 'ADMIN' ? NAV_OPERADOR_EXTRA : []),
  ]

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', paddingBottom: 8, paddingTop: 8, zIndex: 100 }}>
      {items.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? C.accent : C.muted, transition: 'color .15s', padding: '4px 0',
          })}
        >
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