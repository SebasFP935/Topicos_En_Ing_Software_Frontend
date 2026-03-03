import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

export function Layout() {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#06060f', color: '#e8eaf8' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 72 : 0, overflowX: 'hidden' }}>
        <Outlet />
      </main>
      {isMobile && <BottomNav />}
    </div>
  )
}
