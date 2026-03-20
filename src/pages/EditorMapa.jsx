/**
 * EditorMapa.jsx  — src/pages/EditorMapa.jsx
 *
 * Página del Admin para dibujar el plano de un parqueo.
 * Llama a: GET  /api/zonas/{id}/mapa   (carga estado actual)
 *           PUT  /api/zonas/{id}/mapa   (guarda plano + espacios)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Layers, Info, RectangleHorizontal, Square, ParkingSquare, MousePointer2 } from 'lucide-react'
import { C, GRAD } from '../tokens'
import ParkingMap from '../components/ParkingMap'

const FF = 'var(--ff-apple)'

// ── Tip rápido ─────────────────────────────────────────────────────────────
function Tip({ Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
      <Icon size={16} color={C.muted} />
      <span style={{ fontSize: 13.5, color: C.muted, fontFamily: FF, lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

export default function EditorMapa() {
  const { zonaId } = useParams()
  const navigate   = useNavigate()

  const [zona,     setZona]     = useState(null)
  const [plano,    setPlano]    = useState(null)
  const [espacios, setEspacios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)

  // ── Cargar mapa actual ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/zonas/${zonaId}/mapa`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setZona({ nombre: data.zonaNombre, sede: data.sedeNombre })
        setPlano({ elementos: data.plano || [], ancho: data.mapaAncho || 800, alto: data.mapaAlto || 500 })
        setEspacios(data.espacios || [])
      })
      .catch(() => {
        // mapa vacío (zona nueva)
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
          plano:      nuevoPlano.elementos,
          mapaAncho:  nuevoPlano.ancho,
          mapaAlto:   nuevoPlano.alto,
          espacios:   nuevosEspacios.map(e => ({
            id:           e.id?.toString().length === 6 ? null : e.id, // ids temporales (uid) → null
            codigo:       e.codigo,
            tipoVehiculo: e.tipoVehiculo,
            coordenadas:  { x: e.x, y: e.y, w: e.w, h: e.h },
          })),
        }),
      })
      if (!res.ok) throw new Error()
      mostrarToast('Mapa guardado correctamente', 'success')
    } catch {
      mostrarToast('Error al guardar. Intenta de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const mostrarToast = (msg, tipo) => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // ── UI ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(180deg, rgba(5,6,8,.74), rgba(5,6,8,.9))' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: C.muted, fontFamily: FF, fontSize: 14 }}>Cargando mapa…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'radial-gradient(circle at 16% 8%, rgba(0,104,183,.14), transparent 32%), radial-gradient(circle at 92% 5%, rgba(123,165,255,.12), transparent 29%), linear-gradient(180deg, rgba(5,6,8,.72), rgba(5,6,8,.9))' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: 'linear-gradient(180deg, rgba(11,13,17,.94), rgba(11,13,17,.78))',
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} color={C.text} />
          </button>
          <div>
            <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>{zona?.sede}</p>
            <p style={{ fontSize: 23, fontWeight: 820, color: C.text, fontFamily: FF, letterSpacing: '-.02em' }}>
              Editor de mapa — {zona?.nombre || `Zona ${zonaId}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12,
            background: '#7ba5ff1a', border: '1px solid #7ba5ff44',
          }}>
            <Layers size={15} color={C.accent} />
            <span style={{ fontSize: 13.5, color: C.accent, fontFamily: FF, fontWeight: 700 }}>
              {espacios.length} espacios
            </span>
          </div>
        </div>
      </div>

      {/* Layout: canvas + panel ayuda */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {plano && (
            <ParkingMap
              mode="editor"
              plano={plano}
              espacios={espacios}
              onSave={handleSave}
            />
          )}
        </div>

        {/* Panel de ayuda */}
        <div style={{
          width: 280, background: 'linear-gradient(180deg, rgba(11,13,17,.95), rgba(11,13,17,.82))', borderLeft: `1px solid ${C.border}`,
          padding: 20, flexShrink: 0, overflowY: 'auto',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Info size={16} color={C.accent} />
            <span style={{ fontSize: 14, fontWeight: 760, color: C.text, fontFamily: FF }}>Cómo usar</span>
          </div>

          <Tip Icon={RectangleHorizontal} text="Selecciona 'Pared' y arrastra para dibujar los límites del parqueo." />
          <Tip Icon={Square} text="Usa 'Pasillo' para marcar las vías de circulación." />
          <Tip Icon={ParkingSquare} text="Con 'Espacio' arrastra donde va cada plaza. Asigna código y tipo." />
          <Tip Icon={MousePointer2} text="'Mover' para reubicar o seleccionar y eliminar cualquier elemento." />
          <Tip Icon={Save} text="Presiona 'Guardar mapa' cuando termines. Los cambios se aplican al instante." />

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 14 }}>
            <p style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, fontWeight: 760, marginBottom: 10, letterSpacing: 1.1 }}>TIPOS DE VEHICULO</p>
            {[
              { tipo: 'AUTO',         color: '#0068b7' },
              { tipo: 'MOTO',         color: '#8d6bff' },
              { tipo: 'BICICLETA',    color: '#7ba5ff' },
              { tipo: 'DISCAPACIDAD', color: '#ffcc00' },
            ].map(({ tipo, color }) => (
              <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color + '40', border: `1.5px solid ${color}` }} />
                <span style={{ fontSize: 12.5, color: C.muted, fontFamily: FF }}>{tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.tipo === 'success' ? '#0068b720' : '#0068b720',
          border: `1px solid ${toast.tipo === 'success' ? '#0068b750' : '#0068b750'}`,
          color: toast.tipo === 'success' ? '#0068b7' : '#0068b7',
          padding: '12px 24px', borderRadius: 10, fontFamily: FF,
          fontSize: 14, fontWeight: 600, zIndex: 300,
          boxShadow: '0 4px 24px #00000040',
        }}>
          {toast.msg}
        </div>
      )}

      {saving && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000050',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
        }}>
          <div style={{
            background: C.surface, borderRadius: 12, padding: '24px 40px',
            display: 'flex', gap: 12, alignItems: 'center',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: C.text, fontFamily: FF, fontSize: 14 }}>Guardando…</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}


