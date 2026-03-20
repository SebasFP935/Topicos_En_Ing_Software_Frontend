import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, ParkingSquare, ShieldCheck, TimerReset, Car } from 'lucide-react'
import { C, FF, GRAD, MAIN_TITLE_SIZE } from '../tokens'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SectionLabel } from '../components/ui/SectionLabel'
import { auth } from '../utils/auth'

const TIPOS_DOC = ['CI', 'PASAPORTE', 'NIT', 'OTRO']

const LOCAL_CSS = `
  .auth-root {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    padding: 26px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${C.text};
    font-family: ${FF};
  }

  .auth-root::before {
    content: '';
    position: absolute;
    inset: -20% -10%;
    pointer-events: none;
    background:
      radial-gradient(circle at 14% 18%, rgba(0,104,183,.18), transparent 34%),
      radial-gradient(circle at 88% 6%, rgba(123,165,255,.14), transparent 30%),
      radial-gradient(circle at 70% 84%, rgba(255,204,0,.12), transparent 38%);
    z-index: 0;
  }

  .auth-grid {
    width: min(1120px, 100%);
    display: grid;
    grid-template-columns: minmax(340px, 1fr) minmax(320px, 470px);
    gap: 16px;
    position: relative;
    z-index: 1;
    align-items: stretch;
  }

  .auth-aside {
    border-radius: 30px;
    border: 1px solid rgba(255,255,255,.14);
    background:
      radial-gradient(circle at 14% 20%, rgba(0,104,183,.28), transparent 40%),
      radial-gradient(circle at 80% 4%, rgba(123,165,255,.25), transparent 30%),
      linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 45%, rgba(255,255,255,.01)),
      #06080d;
    box-shadow: 0 24px 58px rgba(0,0,0,.4);
    padding: 34px 34px 30px;
    display: flex;
    flex-direction: column;
    min-height: 640px;
    position: relative;
    overflow: hidden;
  }

  .auth-aside::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: .05;
    background-image:
      linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px);
    background-size: 52px 52px;
    pointer-events: none;
  }

  .auth-scene {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: .62;
  }

  .auth-scene svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .auth-slot {
    animation: auth-slot-float 4.2s ease-in-out infinite;
    transform-origin: center;
  }

  .auth-slot.alt {
    animation: auth-slot-float-b 5.1s ease-in-out infinite;
  }

  @keyframes auth-slot-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes auth-slot-float-b {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }

  .auth-logo-box {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: ${GRAD};
    display: grid;
    place-items: center;
    box-shadow: 0 12px 30px rgba(0,104,183,.35);
    flex-shrink: 0;
  }

  .auth-hero {
    margin-top: 28px;
    max-width: 420px;
  }

  .auth-hero h1 {
    font-size: ${MAIN_TITLE_SIZE};
    line-height: .98;
    margin: 0 0 14px;
    letter-spacing: -.04em;
    font-weight: 860;
  }

  .auth-grad {
    background: ${GRAD};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .auth-hero p {
    margin: 0;
    color: ${C.muted};
    font-size: 14px;
    line-height: 1.6;
  }

  .auth-bullets {
    margin-top: 28px;
    display: grid;
    gap: 12px;
  }

  .auth-bullet {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: ${C.muted};
  }

  .auth-bullet-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(0,104,183,.48);
    background: rgba(0,104,183,.14);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .auth-metrics {
    margin-top: auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .auth-metric {
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 13px;
    padding: 10px 10px 11px;
    background: rgba(0,0,0,.24);
  }

  .auth-metric p {
    margin: 0;
  }

  .auth-metric .v {
    color: ${C.text};
    font-size: 21px;
    font-weight: 780;
    letter-spacing: -.03em;
  }

  .auth-metric .k {
    color: ${C.muted};
    font-size: 11px;
    margin-top: 4px;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .auth-main {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-mobile-brand {
    display: none;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .auth-tabs {
    margin-top: 20px;
    display: flex;
    gap: 5px;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid ${C.border};
    background: rgba(255,255,255,.03);
  }

  .auth-tab {
    flex: 1;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: ${C.muted};
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all .18s ease;
    letter-spacing: .01em;
  }

  .auth-tab.active {
    background: ${GRAD};
    color: #fff6f8;
    box-shadow: 0 9px 24px rgba(0,104,183,.25);
  }

  .auth-tab:not(.active):hover {
    color: ${C.text};
    background: rgba(255,255,255,.04);
  }

  .auth-field {
    margin-bottom: 14px;
  }

  .auth-field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 12px;
  }

  .auth-label {
    display: block;
    margin-bottom: 6px;
    color: ${C.muted};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    font-weight: 650;
  }

  .auth-input,
  .auth-select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid ${C.border};
    background: rgba(255,255,255,.03);
    color: ${C.text};
    padding: 11px 13px;
    font-size: 14px;
    font-family: ${FF};
    outline: none;
    transition: border-color .15s, box-shadow .15s, background .15s;
  }

  .auth-input::placeholder {
    color: ${C.muted};
  }

  .auth-input:focus,
  .auth-select:focus {
    border-color: rgba(255,204,0,.75);
    background: rgba(255,255,255,.045);
    box-shadow: 0 0 0 3px rgba(0,104,183,.15);
  }

  .auth-select {
    cursor: pointer;
    appearance: none;
  }

  .auth-pass-wrap {
    position: relative;
  }

  .auth-eye {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border: 0;
    background: transparent;
    color: ${C.muted};
    display: grid;
    place-items: center;
    padding: 4px;
    cursor: pointer;
  }

  .auth-error {
    margin-top: 14px;
    border: 1px solid rgba(0,104,183,.45);
    border-radius: 11px;
    padding: 10px 12px;
    color: ${C.danger};
    background: rgba(0,104,183,.12);
    font-size: 13px;
  }

  .auth-form-scroll {
    max-height: 300px;
    overflow: auto;
    padding-right: 4px;
  }

  .auth-footer-link {
    margin-top: 16px;
    text-align: center;
    color: ${C.muted};
    font-size: 13px;
  }

  .auth-footer-link button {
    border: 0;
    background: transparent;
    color: ${C.accent};
    cursor: pointer;
    font-weight: 700;
    padding: 0;
    font-size: inherit;
    margin-left: 4px;
  }

  .auth-spin {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    animation: auth-spin .7s linear infinite;
  }

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 980px) {
    .auth-grid {
      grid-template-columns: 1fr;
      max-width: 470px;
    }
    .auth-aside {
      display: none;
    }
    .auth-mobile-brand {
      display: flex;
    }
  }

  @media (max-width: 640px) {
    .auth-field-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .auth-root {
      padding: 18px 12px;
    }
  }
`

function FieldLabel({ text, required }) {
  return (
    <label className="auth-label">
      {text}
      {required ? <span style={{ color: C.danger }}> *</span> : null}
    </label>
  )
}

function InputField({ label, type = 'text', value, onChange, placeholder, required }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="auth-field">
      <FieldLabel text={label} required={required} />
      <div className={isPassword ? 'auth-pass-wrap' : ''}>
        <input
          className="auth-input"
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={isPassword ? { paddingRight: 38 } : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="auth-field">
      <FieldLabel text={label} />
      <select className="auth-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function AsideMotion() {
  const slots = [
    { x: 42, y: 170, color: '#ffcc00', alt: false },
    { x: 136, y: 156, color: '#7ba5ff', alt: true },
    { x: 230, y: 142, color: '#0068b7', alt: false },
    { x: 324, y: 128, color: '#8d6bff', alt: true },
    { x: 66, y: 262, color: '#7ba5ff', alt: true },
    { x: 160, y: 248, color: '#ffcc00', alt: false },
    { x: 254, y: 234, color: '#8d6bff', alt: true },
    { x: 348, y: 220, color: '#0068b7', alt: false },
  ]

  return (
    <div className="auth-scene" aria-hidden="true">
      <svg viewBox="0 0 420 640">
        <defs>
          <linearGradient id="laneGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7ba5ff" stopOpacity="0" />
            <stop offset="45%" stopColor="#7ba5ff" stopOpacity=".35" />
            <stop offset="100%" stopColor="#ffcc00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2].map((lane) => (
          <line
            key={lane}
            x1={20}
            y1={178 + lane * 96}
            x2={404}
            y2={126 + lane * 96}
            stroke="url(#laneGrad)"
            strokeDasharray="10 10"
            strokeWidth="1.4"
          />
        ))}

        {slots.map((slot, index) => (
          <g
            key={`${slot.x}-${slot.y}`}
            className={`auth-slot ${slot.alt ? 'alt' : ''}`}
            style={{ animationDelay: `${index * 0.22}s` }}
          >
            <rect
              x={slot.x}
              y={slot.y}
              width="66"
              height="42"
              rx="8"
              fill={`${slot.color}20`}
              stroke={slot.color}
              strokeWidth="1.2"
            />
            <line
              x1={slot.x + 14}
              y1={slot.y + 8}
              x2={slot.x + 52}
              y2={slot.y + 8}
              stroke={slot.color}
              strokeWidth="1.8"
              opacity=".5"
              strokeLinecap="round"
            />
            <rect
              x={slot.x + 22}
              y={slot.y + 14}
              width="22"
              height="17"
              rx="5"
              fill={`${slot.color}30`}
              stroke={`${slot.color}88`}
              strokeWidth="1"
            />
          </g>
        ))}

        <g>
          <g opacity=".95">
            <rect x="-16" y="-8" width="32" height="16" rx="5" fill="#0068b7" />
            <rect x="-10" y="-5" width="20" height="7" rx="3" fill="#ffd6df" fillOpacity=".6" />
            <circle cx="-9" cy="9" r="3" fill="#1a1f2b" />
            <circle cx="9" cy="9" r="3" fill="#1a1f2b" />
            <animateMotion dur="8.2s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pathA" />
            </animateMotion>
          </g>

          <g opacity=".9">
            <rect x="-14" y="-8" width="28" height="16" rx="5" fill="#7ba5ff" />
            <rect x="-9" y="-5" width="18" height="7" rx="3" fill="#d7e5ff" fillOpacity=".6" />
            <circle cx="-8" cy="9" r="3" fill="#1a1f2b" />
            <circle cx="8" cy="9" r="3" fill="#1a1f2b" />
            <animateMotion dur="10.1s" begin="-2.8s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pathB" />
            </animateMotion>
          </g>

          <g opacity=".95">
            <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#8d6bff" />
            <rect x="-10" y="-5" width="20" height="7" rx="3" fill="#e8dcff" fillOpacity=".55" />
            <circle cx="-8.8" cy="9" r="3" fill="#1a1f2b" />
            <circle cx="8.8" cy="9" r="3" fill="#1a1f2b" />
            <animateMotion dur="9.1s" begin="-5.3s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pathC" />
            </animateMotion>
          </g>
        </g>

        <path id="pathA" d="M 26 486 C 132 432, 250 392, 394 350" fill="none" />
        <path id="pathB" d="M 394 438 C 296 386, 172 346, 28 304" fill="none" />
        <path id="pathC" d="M 36 560 C 164 514, 270 474, 396 430" fill="none" />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [reg, setReg] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    tipoDocumento: '',
    numeroDocumento: '',
    telefono: '',
    vehiculoPlaca: '',
    vehiculoModelo: '',
  })

  const setRegField = (key, value) => setReg((prev) => ({ ...prev, [key]: value }))
  const switchTab = (nextTab) => {
    setTab(nextTab)
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await auth.readJson(response, {})
      if (!response.ok) {
        setError(auth.message(data?.mensaje, 'Credenciales incorrectas.'))
        return
      }
      auth.save(auth.normalize(data))
      navigate('/')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!reg.nombre || !reg.apellido || !reg.email || !reg.password) {
      setError('Nombre, apellido, email y contrasena son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: reg.nombre,
          apellido: reg.apellido,
          email: reg.email,
          password: reg.password,
          tipoDocumento: reg.tipoDocumento || null,
          numeroDocumento: reg.numeroDocumento || null,
          telefono: reg.telefono || null,
          vehiculoPlaca: reg.vehiculoPlaca || null,
          vehiculoModelo: reg.vehiculoModelo || null,
        }),
      })
      const data = await auth.readJson(response, {})
      if (!response.ok) {
        setError(auth.message(data?.mensaje, 'Error al registrarse.'))
        return
      }
      auth.save(auth.normalize(data))
      navigate('/')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{LOCAL_CSS}</style>
      <div className="auth-root">
        <div className="auth-grid">
          <aside className="auth-aside">
            <AsideMotion />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="auth-logo-box">
                  <ParkingSquare size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    NoParking
                  </p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 760 }}>UPB Smart Access</p>
                </div>
              </div>

              <div className="auth-hero">
                <h1>
                  Reserva rapido,
                  <br />
                  <span className="auth-grad">entra sin filas.</span>
                </h1>
                <p>
                  El mismo estilo de tu dashboard ahora en autenticacion: acceso rapido, estado claro y flujo directo.
                </p>
              </div>

              <div className="auth-bullets">
                {[
                  { icon: Check, text: 'Ingreso en menos de 1 minuto' },
                  { icon: ShieldCheck, text: 'Validacion segura de usuario' },
                  { icon: TimerReset, text: 'Reserva y activacion por bloque horario' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="auth-bullet">
                    <span className="auth-bullet-dot">
                      <Icon size={12} color={C.accent} />
                    </span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-metrics">
              <div className="auth-metric">
                <p className="v">24/7</p>
                <p className="k">Disponibilidad</p>
              </div>
              <div className="auth-metric">
                <p className="v">QR</p>
                <p className="k">Check-in</p>
              </div>
              <div className="auth-metric">
                <p className="v">1x</p>
                <p className="k">Cuenta unica</p>
              </div>
            </div>
          </aside>

          <main className="auth-main">
            <div style={{ width: '100%' }}>
              <Card
                style={{
                  borderRadius: 28,
                  padding: '22px 22px 20px',
                  background:
                    'radial-gradient(circle at 86% 8%, rgba(0,104,183,.18), transparent 34%), linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02) 46%, rgba(255,255,255,.01)), #06080d',
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >
                <div className="auth-mobile-brand">
                  <div className="auth-logo-box" style={{ width: 38, height: 38, borderRadius: 12 }}>
                    <ParkingSquare size={18} color="#fff" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted }}>NoParking</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 740 }}>UPB Smart Access</p>
                  </div>
                </div>

                <SectionLabel style={{ marginBottom: 6, color: '#ffb8c5' }}>
                  {tab === 'login' ? 'Acceso' : 'Registro'}
                </SectionLabel>
                <h1 style={{ margin: 0, fontSize: MAIN_TITLE_SIZE, lineHeight: 1.04, letterSpacing: '-.03em', fontWeight: 820 }}>
                  {tab === 'login' ? 'Inicia sesion' : 'Crea tu cuenta'}
                </h1>
                <p style={{ margin: '8px 0 0', color: C.muted, fontSize: 13.5, lineHeight: 1.55 }}>
                  {tab === 'login'
                    ? 'Usa tu cuenta institucional para continuar.'
                    : 'Completa tus datos y configura tu vehiculo principal.'}
                </p>

                <div className="auth-tabs">
                  <button
                    type="button"
                    className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                    onClick={() => switchTab('login')}
                  >
                    Iniciar sesion
                  </button>
                  <button
                    type="button"
                    className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                    onClick={() => switchTab('register')}
                  >
                    Registrarse
                  </button>
                </div>

                {error ? <div className="auth-error">{error}</div> : null}

                {tab === 'login' ? (
                  <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="tu@upb.edu"
                      required
                    />
                    <InputField
                      label="Contrasena"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Tu clave"
                      required
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 0 18px' }}>
                      <span style={{ color: C.muted, fontSize: 12.5, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Car size={14} color={C.accent} />
                        UPB parking access
                      </span>
                      <span style={{ color: C.accent, fontSize: 12.5, fontWeight: 700 }}>Olvidaste tu clave?</span>
                    </div>

                    <Button
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', borderRadius: 12 }}
                    >
                      {loading ? (
                        <>
                          <span className="auth-spin" />
                          Ingresando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Button>

                    <p className="auth-footer-link">
                      No tienes cuenta?
                      <button type="button" onClick={() => switchTab('register')}>
                        Registrate gratis
                      </button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} style={{ marginTop: 16 }}>
                    <div className="auth-form-scroll">
                      <SectionLabel style={{ marginBottom: 10 }}>Datos personales</SectionLabel>
                      <div className="auth-field-grid">
                        <InputField
                          label="Nombre"
                          value={reg.nombre}
                          onChange={(value) => setRegField('nombre', value)}
                          placeholder="Juan"
                          required
                        />
                        <InputField
                          label="Apellido"
                          value={reg.apellido}
                          onChange={(value) => setRegField('apellido', value)}
                          placeholder="Perez"
                          required
                        />
                      </div>

                      <InputField
                        label="Email"
                        type="email"
                        value={reg.email}
                        onChange={(value) => setRegField('email', value)}
                        placeholder="tu@upb.edu"
                        required
                      />
                      <InputField
                        label="Contrasena"
                        type="password"
                        value={reg.password}
                        onChange={(value) => setRegField('password', value)}
                        placeholder="Minimo 6 caracteres"
                        required
                      />

                      <div className="auth-field-grid">
                        <SelectField
                          label="Tipo doc."
                          value={reg.tipoDocumento}
                          onChange={(value) => setRegField('tipoDocumento', value)}
                          options={TIPOS_DOC}
                        />
                        <InputField
                          label="Nro documento"
                          value={reg.numeroDocumento}
                          onChange={(value) => setRegField('numeroDocumento', value)}
                          placeholder="12345678"
                        />
                      </div>

                      <InputField
                        label="Telefono"
                        value={reg.telefono}
                        onChange={(value) => setRegField('telefono', value)}
                        placeholder="+591 7..."
                      />

                      <SectionLabel style={{ marginBottom: 10, marginTop: 4 }}>Vehiculo</SectionLabel>
                      <div className="auth-field-grid">
                        <InputField
                          label="Placa"
                          value={reg.vehiculoPlaca}
                          onChange={(value) => setRegField('vehiculoPlaca', value.toUpperCase())}
                          placeholder="ABC-123"
                        />
                        <InputField
                          label="Modelo"
                          value={reg.vehiculoModelo}
                          onChange={(value) => setRegField('vehiculoModelo', value)}
                          placeholder="Toyota Corolla"
                        />
                      </div>
                    </div>

                    <Button
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', borderRadius: 12, marginTop: 18 }}
                    >
                      {loading ? (
                        <>
                          <span className="auth-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          Crear cuenta
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Button>

                    <p className="auth-footer-link">
                      Ya tienes cuenta?
                      <button type="button" onClick={() => switchTab('login')}>
                        Inicia sesion
                      </button>
                    </p>
                  </form>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

