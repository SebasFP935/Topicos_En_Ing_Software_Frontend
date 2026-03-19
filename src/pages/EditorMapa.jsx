/**
 * EditorMapa.jsx  — src/pages/EditorMapa.jsx
 *
 * Página Admin: editor visual del plano de una zona de parqueo.
 * GET  /api/zonas/{id}/mapa
 * PUT  /api/zonas/{id}/mapa
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { C, GRAD } from '../tokens'
import ParkingMap from '../components/ParkingMap'

const FF = "'Plus Jakarta Sans', sans-serif"

// ── Tip de ayuda ───────────────────────────────────────────────────────────
function Tip({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

// ── Pantalla de carga ──────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: C.bg, flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 38, height: 38,
        border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`,
        borderRadius: '50%', animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: C.muted, fontSize: 14, fontFamily: FF }}>Cargando mapa…</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function EditorMapa() {
  const { zonaId } = useParams()
  const navigate   = useNavigate()

  const [zona,        setZona]        = useState(null)
  const [plano,       setPlano]       = useState(null)
  const [espacios,    setEspacios]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState(null)
  const [hayCambios,  setHayCambios]  = useState(false)
  const [panelOpen,   setPanelOpen]   = useState(true)

  // ── Cargar mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/zonas/${zonaId}/mapa`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setZona({ nombre: data.zonaNombre, sede: data.sedeNombre })
        setPlano({
          elementos: data.plano      || [],
          ancho:     data.mapaAncho  || 800,
          alto:      data.mapaAlto   || 500,
        })
        setEspacios(data.espacios || [])
      })
      .catch(() => {
        setPlano({ elementos: [], ancho: 800, alto: 500 })
        setEspacios([])
      })
      .finally(() => setLoading(false))
  }, [zonaId])

  // ── Guardar ────────────────────────────────────────────────────────────
  const handleSave = async (nuevoPlano, nuevosEspacios) => {
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/zonas/${zonaId}/mapa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plano:     nuevoPlano.elementos,
          mapaAncho: nuevoPlano.ancho,
          mapaAlto:  nuevoPlano.alto,
          espacios:  nuevosEspacios.map(e => ({
            id:           e.id?.toString().length === 6 ? null : e.id ?? null,
            codigo:       e.codigo,
            tipoVehiculo: e.tipoVehiculo,
            x: e.x, y: e.y, w: e.w, h: e.h,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      setHayCambios(false)
      showToast('Mapa guardado correctamente', 'success')
    } catch {
      showToast('Error al guardar el mapa', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (msg, tipo) => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return <Loading />

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: C.bg,
      overflow: 'hidden', fontFamily: FF,
    }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '11px 24px', borderRadius: 12, fontFamily: FF,
          fontSize: 13, fontWeight: 600, pointerEvents: 'none',
          background: toast.tipo === 'success' ? '#3de8c8' : '#ff4d6d',
          color: toast.tipo === 'success' ? '#06060f' : '#fff',
          boxShadow: '0 8px 32px #00000060',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: C.surface,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>

        {/* Volver */}
        <button
          onClick={() => {
            if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Salir igualmente?')) return
            navigate('/admin')
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', fontSize: 13, fontFamily: FF,
            padding: '5px 9px', borderRadius: 8,
          }}
        >
          <ArrowLeft size={15} /> Volver
        </button>

        <div style={{ width: 1, height: 20, background: C.border }} />

        {/* Info zona */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.8 }}>
            {zona?.sede ? `${zona.sede} · ` : ''}EDITOR DE ZONA
          </span>
          <span style={{ fontSize: 15, color: C.text, fontWeight: 800 }}>
            {zona?.nombre ?? '—'}
          </span>
        </div>

        {/* Indicador cambios */}
        {hayCambios && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#ffaa0018', border: '1px solid #ffaa0040',
            borderRadius: 8, padding: '4px 10px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffaa00' }} />
            <span style={{ fontSize: 11, color: '#ffaa00', fontWeight: 600 }}>Sin guardar</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Espacios count */}
        <div style={{
          background: C.s2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>Espacios:</span>
          <span style={{ fontSize: 13, color: C.accent, fontFamily: FF, fontWeight: 700 }}>
            {espacios.length}
          </span>
        </div>

        {/* Guardar (header) */}
        <button
          onClick={() => {}} // ParkingMap maneja el save internamente
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: GRAD, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={14} />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {/* ── Layout canvas + panel ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {plano && (
            <ParkingMap
              mode="editor"
              plano={plano}
              espacios={espacios}
              onSave={(nuevoPlano, nuevosEspacios) => {
                setHayCambios(false)
                handleSave(nuevoPlano, nuevosEspacios)
              }}
            />
          )}
        </div>

        {/* ── Panel ayuda colapsable ── */}
        <div style={{
          display: 'flex', flexShrink: 0, position: 'relative',
          transition: 'width .25s ease',
          width: panelOpen ? 210 : 0,
          overflow: 'hidden',
        }}>
          <div style={{
            width: 210, background: C.surface,
            borderLeft: `1px solid ${C.border}`,
            padding: 18, overflowY: 'auto', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Info size={13} color={C.accent} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Cómo usar</span>
            </div>

            <Tip icon="▬" text="Pared — arrastra para delimitar bordes del parqueo." />
            <Tip icon="⬜" text="Pasillo — marca vías de circulación." />
            <Tip icon="🅿" text="Espacio — arrastra donde va la plaza, asigna código y tipo." />
            <Tip icon="↖" text="Seleccionar — mueve o elimina cualquier elemento." />
            <Tip icon="🖱" text="Ctrl+rueda para zoom. Espacio+arrastrar para mover la vista." />
            <Tip icon="💾" text="Usa el botón flotante en el canvas o el botón 'Guardar' del header." />

            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14 }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>
                TIPOS DE VEHÍCULO
              </p>
              {[
                { tipo: 'AUTO',         color: '#5b7eff', icon: '🚗' },
                { tipo: 'MOTO',         color: '#a259ff', icon: '🏍' },
                { tipo: 'BICICLETA',    color: '#3de8c8', icon: '🚲' },
                { tipo: 'DISCAPACIDAD', color: '#ffaa00', icon: '♿' },
              ].map(({ tipo, color, icon }) => (
                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    background: color + '28', border: `1.5px solid ${color}`,
                  }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{icon} {tipo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle panel */}
        <button
          onClick={() => setPanelOpen(o => !o)}
          title={panelOpen ? 'Cerrar panel' : 'Abrir ayuda'}
          style={{
            position: 'absolute', right: panelOpen ? 210 : 0,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 20, width: 20, height: 44,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRight: panelOpen ? 'none' : undefined,
            borderLeft:  panelOpen ? undefined : 'none',
            borderRadius: panelOpen ? '6px 0 0 6px' : '0 6px 6px 0',
            cursor: 'pointer', color: C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'right .25s ease',
          }}
        >
          {panelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </div>
  )
}