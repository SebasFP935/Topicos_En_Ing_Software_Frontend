// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParkingSquare, Eye, EyeOff } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

const TIPOS_DOC = ['CI', 'PASAPORTE', 'NIT', 'OTRO']

function Input({ label, type = 'text', value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: FF, display: 'block', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#ff4d6d' }}> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 14px',
            paddingRight: isPass ? 40 : 14,
            borderRadius: 10, boxSizing: 'border-box',
            background: C.s2, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, fontFamily: FF,
            outline: 'none',
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {show ? <EyeOff size={16} color={C.muted} /> : <Eye size={16} color={C.muted} />}
          </button>
        )}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: FF, display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: C.s2, border: `1px solid ${C.border}`,
          color: C.text, fontSize: 14, fontFamily: FF, boxSizing: 'border-box',
        }}
      >
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  // Login form
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Register form
  const [reg, setReg] = useState({
    nombre: '', apellido: '', email: '', password: '',
    tipoDocumento: '', numeroDocumento: '',
    telefono: '', vehiculoPlaca: '', vehiculoModelo: '',
  })

  const setR = (k, v) => setReg(prev => ({ ...prev, [k]: v }))

  // ── Login ────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.mensaje || 'Credenciales incorrectas.')
        return
      }
      auth.save(data)
      navigate('/')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  // ── Register ─────────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault()
    setError('')
    if (!reg.nombre || !reg.apellido || !reg.email || !reg.password) {
      setError('Nombre, apellido, email y contraseña son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const body = {
        nombre:          reg.nombre,
        apellido:        reg.apellido,
        email:           reg.email,
        password:        reg.password,
        tipoDocumento:   reg.tipoDocumento || null,
        numeroDocumento: reg.numeroDocumento || null,
        telefono:        reg.telefono || null,
        vehiculoPlaca:   reg.vehiculoPlaca || null,
        vehiculoModelo:  reg.vehiculoModelo || null,
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.mensaje || 'Error al registrarse.')
        return
      }
      auth.save(data)
      navigate('/')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ParkingSquare size={24} color="#fff" />
          </div>
          <span style={{
            fontSize: 24, fontWeight: 800, fontFamily: FF,
            background: GRAD, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>NoParking</span>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: 28,
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: C.s2, borderRadius: 12,
            padding: 4, marginBottom: 24, gap: 4,
          }}>
            {[['login', 'Iniciar sesión'], ['register', 'Registrarse']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setError('') }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 9, border: 'none',
                  background: tab === id ? GRAD : 'transparent',
                  color: tab === id ? '#fff' : C.muted,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
                }}
              >{label}</button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#ff4d6d14', border: '1px solid #ff4d6d30',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#ff4d6d', fontSize: 13, fontFamily: FF,
            }}>
              {error}
            </div>
          )}

          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <Input label="Email" type="email" value={email} onChange={setEmail}
                placeholder="tu@email.com" required />
              <Input label="Contraseña" type="password" value={password} onChange={setPassword}
                placeholder="••••••••" required />
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: loading ? C.border : GRAD,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer', fontFamily: FF,
                  marginTop: 8,
                }}
              >{loading ? 'Ingresando...' : 'Ingresar'}</button>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Input label="Nombre" value={reg.nombre} onChange={v => setR('nombre', v)}
                  placeholder="Juan" required />
                <Input label="Apellido" value={reg.apellido} onChange={v => setR('apellido', v)}
                  placeholder="Pérez" required />
              </div>
              <Input label="Email" type="email" value={reg.email} onChange={v => setR('email', v)}
                placeholder="tu@email.com" required />
              <Input label="Contraseña" type="password" value={reg.password} onChange={v => setR('password', v)}
                placeholder="Mínimo 6 caracteres" required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Select label="Tipo documento" value={reg.tipoDocumento}
                  onChange={v => setR('tipoDocumento', v)} options={TIPOS_DOC} />
                <Input label="N° documento" value={reg.numeroDocumento}
                  onChange={v => setR('numeroDocumento', v)} placeholder="12345678" />
              </div>
              <Input label="Teléfono" value={reg.telefono} onChange={v => setR('telefono', v)}
                placeholder="+591 7..." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Input label="Placa vehículo" value={reg.vehiculoPlaca}
                  onChange={v => setR('vehiculoPlaca', v)} placeholder="ABC-123" />
                <Input label="Modelo" value={reg.vehiculoModelo}
                  onChange={v => setR('vehiculoModelo', v)} placeholder="Toyota Corolla" />
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: loading ? C.border : GRAD,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer', fontFamily: FF,
                  marginTop: 8,
                }}
              >{loading ? 'Registrando...' : 'Crear cuenta'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}