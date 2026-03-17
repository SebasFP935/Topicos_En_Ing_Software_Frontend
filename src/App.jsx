// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Reservar from './pages/Reservar'
import MisReservas from './pages/MisReservas'
import AdminDashboard from './pages/AdminDashboard'
import EditorMapa from './pages/EditorMapa'
import MapasGestion from './pages/MapasGestion'
import Login from './pages/Login'
import Escanear from './pages/Escanear'
import { auth } from './utils/auth'

function PrivateRoute({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  if (!auth.isAdmin()) return <Navigate to="/" replace />
  return children
}

function StaffRoute({ children }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  if (!auth.isStaff()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/escanear/:token" element={<Escanear />} />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/reservas" element={<MisReservas />} />

        <Route
          path="/mapas"
          element={
            <StaffRoute>
              <MapasGestion />
            </StaffRoute>
          }
        />

        <Route
          path="/mapas/zonas/:zonaId/editor"
          element={
            <StaffRoute>
              <EditorMapa />
            </StaffRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/zonas/:zonaId/editor"
          element={
            <StaffRoute>
              <EditorMapa />
            </StaffRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
