import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { C } from '../tokens'

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
    <div style={{
      display: 'flex',
      height: '100dvh',
      minHeight: '100dvh',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(5,6,8,.74), rgba(5,6,8,.9))',
      color: C.text,
      position: 'relative',
      isolation: 'isolate',
    }}>
      {!isMobile && <Sidebar />}
      <main style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: isMobile ? 82 : 0,
      }}>
        <Outlet />
      </main>
      {isMobile && <BottomNav />}
    </div>
  )
}
