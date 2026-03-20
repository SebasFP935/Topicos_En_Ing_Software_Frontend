// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout }          from './components/Layout'
import Home                from './pages/Home'
import Reservar            from './pages/Reservar'
import MisReservas         from './pages/MisReservas'
import AdminDashboard      from './pages/AdminDashboard'
import EditorMapa          from './pages/EditorMapa'
import Login               from './pages/Login'
import Escanear            from './pages/Escanear'
import OperadorDashboard   from './pages/OperadorDashboard'
import OperadorZonas       from './pages/OperadorZonas'
import OperadorEditorMapa  from './pages/OperadorEditorMapa'
import { auth }            from './utils/auth'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGA, trackPage } from './utils/analytics'

initGA()

function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPage(location.pathname + location.search)
  }, [location])
  return null
}

function PrivateRoute({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  if (!auth.isAdmin())         return <Navigate to="/"      replace />
  return children
}

function OperadorRoute({ children }) {
  if (!auth.isAuthenticated())   return <Navigate to="/login" replace />
  if (!auth.isAdminOrOperador()) return <Navigate to="/"      replace />
  return children
}

export default function App() {
  return (
    <>
      <RouteTracker />
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Escaneo QR */}
        <Route path="/escanear/:codigoQrFisico" element={<Escanear />} />

        {/* Protegidas — dentro del Layout */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/"         element={<Home />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/reservas" element={<MisReservas />} />

          {/* Admin */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/zonas/:zonaId/editor" element={
            <AdminRoute><EditorMapa /></AdminRoute>
          } />

          {/* Operador */}
          <Route path="/operador" element={
            <OperadorRoute><OperadorDashboard /></OperadorRoute>
          } />
          <Route path="/operador/zonas" element={
            <OperadorRoute><OperadorZonas /></OperadorRoute>
          } />
          <Route path="/operador/zonas/:zonaId/editor" element={
            <OperadorRoute><OperadorEditorMapa /></OperadorRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

