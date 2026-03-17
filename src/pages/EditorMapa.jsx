import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Info, Layers, XCircle } from 'lucide-react'
import ParkingMap from '../components/ParkingMap'
import { C } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

function Tip({ text }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: FF, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function parsePersistedId(id) {
  if (typeof id === 'number' && Number.isFinite(id)) return id
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
  return null
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EditorMapa() {
  const { zonaId } = useParams()
  const navigate = useNavigate()

  const [zona, setZona] = useState(null)
  const [plano, setPlano] = useState(null)
  const [planoImagen, setPlanoImagen] = useState(null)
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const espaciosCount = useMemo(() => espacios.length, [espacios])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let mounted = true

    auth
      .fetchAuth(`/api/zonas/${zonaId}/mapa`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('No se pudo cargar el mapa.')
        }
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        setZona({
          nombre: data?.zonaNombre || `Zona ${zonaId}`,
        })
        setPlano({
          elementos: Array.isArray(data?.plano) ? data.plano : [],
          ancho: data?.mapaAncho || 1200,
          alto: data?.mapaAlto || 700,
        })
        setPlanoImagen(data?.planoImagen || null)
        setEspacios(Array.isArray(data?.espacios) ? data.espacios : [])
      })
      .catch(() => {
        if (!mounted) return
        setPlano({ elementos: [], ancho: 1200, alto: 700 })
        setPlanoImagen(null)
        setEspacios([])
        showToast('No se pudo cargar el mapa existente. Se abrio uno nuevo.', 'error')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [zonaId])

  const handleFileInput = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten imagenes.', 'error')
      return
    }
    try {
      const dataUrl = await readAsDataUrl(file)
      setPlanoImagen(dataUrl)
      showToast('Imagen cargada. Ahora puedes ajustar los espacios.', 'success')
    } catch {
      showToast('No se pudo leer la imagen.', 'error')
    }
  }

  const handleSave = async (nuevoPlano, nuevosEspacios) => {
    setSaving(true)
    try {
      const payload = {
        mapaAncho: nuevoPlano.ancho,
        mapaAlto: nuevoPlano.alto,
        planoImagen: planoImagen || null,
        plano: nuevosPlanoElementos(nuevoPlano.elementos),
        espacios: (nuevosEspacios || []).map((e) => ({
          id: parsePersistedId(e.id),
          codigo: e.codigo,
          tipoVehiculo: e.tipoVehiculo,
          x: Number(e.x),
          y: Number(e.y),
          w: Number(e.w),
          h: Number(e.h),
          angulo: Number(e.angulo || 0),
        })),
      }

      const res = await auth.fetchAuth(`/api/zonas/${zonaId}/mapa`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let msg = 'Error al guardar el mapa.'
        try {
          const body = await res.json()
          msg = body?.mensaje || msg
        } catch {
          // keep default message
        }
        throw new Error(msg)
      }

      const data = await res.json()
      setPlano({
        elementos: Array.isArray(data?.plano) ? data.plano : [],
        ancho: data?.mapaAncho || nuevoPlano.ancho,
        alto: data?.mapaAlto || nuevoPlano.alto,
      })
      setPlanoImagen(data?.planoImagen || null)
      setEspacios(Array.isArray(data?.espacios) ? data.espacios : [])
      showToast('Mapa guardado correctamente.')
    } catch (err) {
      showToast(err.message || 'Error al guardar el mapa.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `3px solid ${C.border}`,
              borderTopColor: C.accent,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ color: C.muted, fontFamily: FF, fontSize: 14 }}>Cargando mapa...</p>
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: C.s2,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={C.muted} />
          </button>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: FF }}>
              Editor de mapa - {zona?.nombre || `Zona ${zonaId}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 8,
              background: '#5b7eff14',
              border: '1px solid #5b7eff30',
            }}
          >
            <Layers size={13} color={C.accent} />
            <span style={{ fontSize: 12, color: C.accent, fontFamily: FF, fontWeight: 600 }}>{espaciosCount} espacios</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {plano && <ParkingMap mode="editor" plano={plano} planoImagen={planoImagen} espacios={espacios} onSave={handleSave} />}
        </div>

        <div
          style={{
            width: 260,
            background: C.surface,
            borderLeft: `1px solid ${C.border}`,
            padding: 20,
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Info size={14} color={C.accent} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FF }}>Como usar</span>
          </div>

          <Tip text="Sube una imagen del plano (opcional) para usarla como fondo." />
          <Tip text="Selecciona Espacio y arrastra para dibujar cada celda del parqueo." />
          <Tip text="Con Mover puedes reubicar elementos y espacios existentes." />
          <Tip text="Con Eliminar puedes quitar un espacio o una forma del mapa." />

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14 }}>
            <label
              htmlFor="map-image-input"
              style={{
                width: '100%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.s2,
                color: C.text,
                cursor: 'pointer',
                fontFamily: FF,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Upload size={14} />
              Cargar imagen de plano
            </label>
            <input id="map-image-input" type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />

            {planoImagen && (
              <button
                onClick={() => setPlanoImagen(null)}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '9px 10px',
                  borderRadius: 10,
                  border: '1px solid #ff4d6d50',
                  background: '#ff4d6d14',
                  color: '#ff4d6d',
                  cursor: 'pointer',
                  fontFamily: FF,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <XCircle size={14} />
                Quitar imagen
              </button>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 14 }}>
            <p style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
              TIPOS DE VEHICULO
            </p>
            {[
              { tipo: 'AUTO', color: '#5b7eff' },
              { tipo: 'MOTO', color: '#a259ff' },
              { tipo: 'DISCAPACITADO', color: '#ffaa00' },
              { tipo: 'ELECTRICO', color: '#3de8c8' },
            ].map(({ tipo, color }) => (
              <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: `${color}40`, border: `1.5px solid ${color}` }} />
                <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>{tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#3de8c820' : '#ff4d6d20',
            border: `1px solid ${toast.type === 'success' ? '#3de8c850' : '#ff4d6d50'}`,
            color: toast.type === 'success' ? '#3de8c8' : '#ff4d6d',
            padding: '12px 24px',
            borderRadius: 10,
            fontFamily: FF,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 300,
            boxShadow: '0 4px 24px #00000040',
          }}
        >
          {toast.msg}
        </div>
      )}

      {saving && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#00000050',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 400,
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 12,
              padding: '24px 40px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${C.border}`,
                borderTopColor: C.accent,
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ color: C.text, fontFamily: FF, fontSize: 14 }}>Guardando...</span>
          </div>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}
    </div>
  )
}

function nuevosPlanoElementos(elementos) {
  return (elementos || []).map((e) => ({
    type: e.type,
    x: Number(e.x),
    y: Number(e.y),
    w: Number(e.w),
    h: Number(e.h),
  }))
}
