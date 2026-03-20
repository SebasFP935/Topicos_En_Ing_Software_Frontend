// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ParkingSquare, ArrowRight, Car, Check } from 'lucide-react'
import { auth } from '../utils/auth'
import { trackEvent } from '../utils/analytics'

const TIPOS_DOC = ['CI', 'PASAPORTE', 'NIT', 'OTRO']
const API_BASE = import.meta.env.VITE_API_URL ?? ''

// ── Colores propios (no depende de tokens globales para ser autónomo) ───────
const BG       = '#031428'
const SURFACE  = '#052347'
const BORDER   = '#1a4b7a'
const ACCENT   = '#0068b7'
const PURPLE   = '#005b99'
const TEAL     = '#f8d600'
const TEXT     = '#f7fbff'
const MUTED    = '#9fb8d5'
const DANGER   = '#ff5a67'
const GRAD     = 'linear-gradient(135deg, #003366 0%, #0068b7 72%, #f8d600 100%)'
const GRAD2    = 'linear-gradient(135deg, #005b99 0%, #003366 65%, #ffcc00 100%)'

// ── Estilos globales (font import) ──────────────────────────────────────────
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: ${BG}; }

  .np-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid ${BORDER};
    color: ${TEXT};
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .np-input::placeholder { color: ${MUTED}; }
  .np-input:focus {
    border-color: ${ACCENT};
    background: rgba(91,126,255,0.06);
    box-shadow: 0 0 0 3px rgba(91,126,255,0.12);
  }

  .np-btn-primary {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: ${GRAD};
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 24px rgba(91,126,255,0.3);
    letter-spacing: 0.01em;
  }
  .np-btn-primary:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(91,126,255,0.4);
  }
  .np-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .np-btn-primary:disabled { opacity: 0.5; cursor: default; box-shadow: none; }

  .np-tab {
    flex: 1;
    padding: 10px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: ${MUTED};
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all .2s;
  }
  .np-tab.active {
    background: ${GRAD};
    color: #fff;
    box-shadow: 0 2px 12px rgba(91,126,255,0.35);
  }
  .np-tab:not(.active):hover { color: ${TEXT}; background: rgba(255,255,255,0.05); }

  .np-field-grid { display: grid; gap: 0 14px; }

  @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
  @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-2deg)} }
  @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulseDot { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spinSlow { to{transform:rotate(360deg)} }

  .anim-fade-slide { animation: fadeSlideIn .5s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-slide-d1 { animation: fadeSlideIn .5s .08s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-slide-d2 { animation: fadeSlideIn .5s .16s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-slide-d3 { animation: fadeSlideIn .5s .24s cubic-bezier(.22,1,.36,1) both; }

  .np-form-scroll {
    max-height: 56vh;
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: ${BORDER} transparent;
  }
  .np-form-scroll::-webkit-scrollbar { width: 4px; }
  .np-form-scroll::-webkit-scrollbar-track { background: transparent; }
  .np-form-scroll::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }

  .np-mobile-logo {
    display: none;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  @media (max-width: 860px) {
    .np-left-panel { display: none !important; }
    .np-mobile-logo { display: flex !important; }
  }
`

// ── Componente Input ────────────────────────────────────────────────────────
function Field({ label, required, children, half }) {
  return (
    <div style={{ marginBottom: 16, gridColumn: half ? undefined : '1 / -1' }}>
      <label style={{
        display: 'block', marginBottom: 6,
        fontSize: 12, fontWeight: 600, color: MUTED,
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase',
      }}>
        {label}
        {required && <span style={{ color: DANGER, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder, required, half }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <Field label={label} required={required} half={half}>
      <div style={{ position: 'relative' }}>
        <input
          className="np-input"
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: isPass ? 44 : 16 }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: MUTED, display: 'flex', alignItems: 'center',
            }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </Field>
  )
}

function SelectField({ label, value, onChange, options, half }) {
  return (
    <Field label={label} half={half}>
      <select
        className="np-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', cursor: 'pointer' }}
      >
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  )
}

// ── Panel izquierdo decorativo ──────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{
      flex: 1, background: 'linear-gradient(155deg, #031428 0%, #052347 42%, #0a2f5c 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '48px 44px', minHeight: '100vh',
    }}>
      {/* Ruido de fondo */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '180px',
      }}/>

      {/* Círculos de fondo */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,126,255,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(162,89,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Ilustración isométrica de espacios de parqueo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 420 520" style={{ width: '100%', height: '100%', opacity: 0.22 }}>
          {/* Grid de plazas isométricas */}
          {[0,1,2,3].map(row =>
            [0,1,2].map(col => {
              const x = 60 + col * 110 + row * 18
              const y = 140 + row * 85 - col * 12
  const colors = ['#0068b7', '#005b99', '#f8d600', '#003366']
              const c = colors[(row + col) % colors.length]
              return (
                <g key={`${row}-${col}`} style={{ animation: `floatA ${3.5 + (row+col)*0.4}s ease-in-out infinite`, animationDelay: `${(row*col*0.3)}s` }}>
                  <rect x={x} y={y} width={80} height={56} rx={6}
                    fill={c + '18'} stroke={c} strokeWidth={1.2}/>
                  <line x1={x+20} y1={y+5} x2={x+60} y2={y+5}
                    stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.5}/>
                  <rect x={x+28} y={y+18} width={24} height={22} rx={4}
                    fill={c + '30'} stroke={c + '80'} strokeWidth={1}/>
                </g>
              )
            })
          )}
          {/* Líneas de carril */}
          {[0,1,2].map(i => (
            <line key={i} x1={50} y1={100 + i*120} x2={380} y2={80 + i*120}
              stroke="#5b7eff" strokeWidth={0.8} strokeDasharray="12 8" opacity={0.25}/>
          ))}
        </svg>
      </div>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, animation: 'fadeSlideIn .6s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(91,126,255,0.45)',
          }}>
            <ParkingSquare size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: 20, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            color: TEXT, letterSpacing: '-.01em',
          }}>NoParking</span>
        </div>
      </div>

      {/* Copy principal */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 42, fontWeight: 900, lineHeight: 1.1,
          color: TEXT, marginBottom: 18, letterSpacing: '-.02em',
        }}>
          Tu espacio,<br />
          <span style={{
            background: GRAD,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>siempre listo.</span>
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, color: MUTED, lineHeight: 1.65, maxWidth: 300,
        }}>
          Reserva tu lugar en el parqueo de la UPB en segundos. Sin filas, sin estrés.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
          {[
            'Reserva en menos de 1 minuto',
            'Scanea el Qr cuando llegues',
          ].map((f, i) => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              animation: `fadeSlideIn .5s ${0.2 + i * 0.1}s both`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(61,232,200,0.15)',
                border: '1.5px solid rgba(61,232,200,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={12} color={TEAL} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 13, color: MUTED, fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: MUTED + '80', fontFamily: "'DM Sans', sans-serif" }}>
          © {new Date().getFullYear()} NoParking · UPB
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab,     setTab]     = useState('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const redirectTo = location.state?.redirect

  // Login
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Register
  const [reg, setReg] = useState({
    nombre: '', apellido: '', email: '', password: '',
    tipoDocumento: '', numeroDocumento: '',
    telefono: '', vehiculoPlaca: '', vehiculoModelo: '',
  })
  const setR = (k, v) => setReg(p => ({ ...p, [k]: v }))

  const switchTab = (t) => { setTab(t); setError('') }

  // ── Login ──────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.mensaje || 'Credenciales incorrectas.'); trackEvent('Auth', 'login_error'); return }
      auth.save(data)
      trackEvent('Auth', 'login_success', data.rol)
      navigate(typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/', { replace: true })
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  // ── Register ───────────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault()
    setError('')
    if (!reg.nombre || !reg.apellido || !reg.email || !reg.password) {
      setError('Nombre, apellido, email y contraseña son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:          reg.nombre,
          apellido:        reg.apellido,
          email:           reg.email,
          password:        reg.password,
          tipoDocumento:   reg.tipoDocumento  || null,
          numeroDocumento: reg.numeroDocumento || null,
          telefono:        reg.telefono        || null,
          vehiculoPlaca:   reg.vehiculoPlaca   || null,
          vehiculoModelo:  reg.vehiculoModelo  || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.mensaje || 'Error al registrarse.'); return }
      auth.save(data)
      navigate(typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/', { replace: true })
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: BG,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Panel izquierdo — solo en desktop */}
        <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
          {/* LEFT panel */}
          <div
            className="np-left-panel"
            style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column' }}
          >
            <LeftPanel />
          </div>

          {/* RIGHT — formulario */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            background: SURFACE,
            position: 'relative',
            overflowY: 'auto',
            minHeight: '100vh',
          }}>
            {/* Glow sutil */}
            <div style={{
              position: 'absolute', top: '20%', left: '50%',
              transform: 'translateX(-50%)',
              width: 400, height: 300,
              background: 'radial-gradient(ellipse, rgba(91,126,255,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}/>

            <div style={{
              width: '100%', maxWidth: 420,
              position: 'relative', zIndex: 1,
            }}>

              {/* Header del form */}
              <div className="anim-fade-slide" style={{ marginBottom: 32 }}>
                {/* Logo mobile - hidden on desktop via CSS */}
                <div className="np-mobile-logo">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ParkingSquare size={18} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>NoParking</span>
                </div>

                <h1 style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 32, fontWeight: 900,
                  color: TEXT, marginBottom: 8,
                  letterSpacing: '-.02em', lineHeight: 1.1,
                }}>
                  {tab === 'login' ? 'Bienvenido de vuelta' : 'Crear una cuenta'}
                </h1>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                  {tab === 'login'
                    ? 'Ingresa tus datos para acceder a tu cuenta'
                    : 'Completa el formulario para registrarte en el sistema'}
                </p>
              </div>

              {/* Tabs */}
              <div className="anim-fade-slide-d1" style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)',
                borderRadius: 12, padding: 4, marginBottom: 28, gap: 4,
                border: `1px solid ${BORDER}`,
              }}>
                <button className={`np-tab ${tab === 'login' ? 'active' : ''}`}
                  onClick={() => switchTab('login')}>
                  Iniciar sesión
                </button>
                <button className={`np-tab ${tab === 'register' ? 'active' : ''}`}
                  onClick={() => switchTab('register')}>
                  Registrarse
                </button>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(255,77,109,0.08)',
                  border: `1px solid rgba(255,77,109,0.3)`,
                  borderRadius: 10, padding: '11px 14px',
                  color: DANGER, fontSize: 13.5, marginBottom: 20,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  animation: 'fadeIn .25s both',
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  {error}
                </div>
              )}

              {/* ── LOGIN ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="anim-fade-slide-d2">
                  <Input label="Email" type="email" value={email}
                    onChange={setEmail} placeholder="tu@upb.edu" required />
                  <Input label="Contraseña" type="password" value={password}
                    onChange={setPassword} placeholder="••••••••" required />

                  <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12.5, color: ACCENT, cursor: 'default', fontWeight: 500 }}>
                      ¿Olvidaste tu contraseña?
                    </span>
                  </div>

                  <button type="submit" disabled={loading} className="np-btn-primary">
                    {loading ? (
                      <>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spinSlow .7s linear infinite' }}/>
                        Ingresando...
                      </>
                    ) : (
                      <>Ingresar <ArrowRight size={16} /></>
                    )}
                  </button>

                  <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: MUTED }}>
                    ¿No tienes cuenta?{' '}
                    <span
                      onClick={() => switchTab('register')}
                      style={{ color: ACCENT, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Regístrate gratis
                    </span>
                  </p>
                </form>
              )}

              {/* ── REGISTER ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="anim-fade-slide-d2">
                  <div className="np-form-scroll">
                    {/* Datos personales */}
                    <p style={{
                      fontSize: 11, fontWeight: 700, color: MUTED,
                      letterSpacing: '.08em', textTransform: 'uppercase',
                      marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ flex: 1, height: 1, background: BORDER, display: 'inline-block' }}/>
                      Datos personales
                      <span style={{ flex: 1, height: 1, background: BORDER, display: 'inline-block' }}/>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                      <Input label="Nombre" value={reg.nombre}
                        onChange={v => setR('nombre', v)} placeholder="Juan" required half />
                      <Input label="Apellido" value={reg.apellido}
                        onChange={v => setR('apellido', v)} placeholder="Pérez" required half />
                    </div>

                    <Input label="Email" type="email" value={reg.email}
                      onChange={v => setR('email', v)} placeholder="tu@upb.edu" required />
                    <Input label="Contraseña" type="password" value={reg.password}
                      onChange={v => setR('password', v)} placeholder="Mínimo 6 caracteres" required />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                      <SelectField label="Tipo doc." value={reg.tipoDocumento}
                        onChange={v => setR('tipoDocumento', v)} options={TIPOS_DOC} half />
                      <Input label="N° documento" value={reg.numeroDocumento}
                        onChange={v => setR('numeroDocumento', v)} placeholder="12345678" half />
                    </div>

                    <Input label="Teléfono" value={reg.telefono}
                      onChange={v => setR('telefono', v)} placeholder="+591 7..." />

                    {/* Vehículo */}
                    <p style={{
                      fontSize: 11, fontWeight: 700, color: MUTED,
                      letterSpacing: '.08em', textTransform: 'uppercase',
                      marginTop: 4, marginBottom: 14,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ flex: 1, height: 1, background: BORDER, display: 'inline-block' }}/>
                      Vehículo (opcional)
                      <span style={{ flex: 1, height: 1, background: BORDER, display: 'inline-block' }}/>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px', marginBottom: 0 }}>
                      <Input label="Placa" value={reg.vehiculoPlaca}
                        onChange={v => setR('vehiculoPlaca', v.toUpperCase())} placeholder="ABC-123" half />
                      <Input label="Modelo" value={reg.vehiculoModelo}
                        onChange={v => setR('vehiculoModelo', v)} placeholder="Toyota Corolla" half />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={loading} className="np-btn-primary">
                      {loading ? (
                        <>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spinSlow .7s linear infinite' }}/>
                          Creando cuenta...
                        </>
                      ) : (
                        <>Crear cuenta <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>

                  <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: MUTED }}>
                    ¿Ya tienes cuenta?{' '}
                    <span
                      onClick={() => switchTab('login')}
                      style={{ color: ACCENT, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Inicia sesión
                    </span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
