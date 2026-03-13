// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home          from './pages/Home'
import Reservar      from './pages/Reservar'
import MisReservas   from './pages/MisReservas'
import AdminDashboard from './pages/AdminDashboard'
import EditorMapa    from './pages/EditorMapa'
import Login         from './pages/Login'
import { auth }      from './utils/auth'

// Ruta protegida — redirige a /login si no hay sesión
function PrivateRoute({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />
}

// Ruta solo para admin
function AdminRoute({ children }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  if (!auth.isAdmin())         return <Navigate to="/"      replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Protegidas — dentro del Layout (sidebar + bottomnav) */}
      <Route element={
        <PrivateRoute><Layout /></PrivateRoute>
      }>
        <Route path="/"         element={<Home />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/reservas" element={<MisReservas />} />

        {/* Solo admin */}
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/admin/zonas/:zonaId/editor" element={
          <AdminRoute><EditorMapa /></AdminRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}