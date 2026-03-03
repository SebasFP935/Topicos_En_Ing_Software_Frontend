import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Reservar from './pages/Reservar'
import MisReservas from './pages/MisReservas'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/reservas" element={<MisReservas />} />
        <Route path="/admin"    element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}
