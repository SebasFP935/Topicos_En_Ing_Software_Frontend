// src/components/BottomNav.jsx
import { NavLink } from 'react-router-dom'
import { Home, CalendarCheck, BookOpen, LayoutDashboard, Wrench } from 'lucide-react'
import { C, FF } from '../tokens'
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
    <nav style={{ position: 'fixed', bottom: 10, left: 10, right: 10, background: 'rgba(10,13,18,.9)', border: `1px solid ${C.border}`, backdropFilter: 'blur(10px)', borderRadius: 18, display: 'flex', paddingBottom: 8, paddingTop: 8, zIndex: 100, boxShadow: '0 10px 24px rgba(0,0,0,.34)' }}>
      {items.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? C.text : C.muted, transition: 'color .15s', padding: '4px 0',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ width: 40, height: 28, borderRadius: 10, border: isActive ? `1px solid ${C.accent}66` : '1px solid transparent', background: isActive ? 'linear-gradient(130deg, rgba(0,104,183,.22), rgba(123,165,255,.16))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: FF }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

