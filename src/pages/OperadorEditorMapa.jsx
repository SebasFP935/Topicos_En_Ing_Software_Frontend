// src/pages/OperadorEditorMapa.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Grid, Plus, Trash2, QrCode,
  Download, AlertTriangle, X, Image, RefreshCw,
  ZoomIn, ZoomOut, RotateCcw, Move,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"
const SNAP = 5

const snapV = v => Math.round(v / SNAP) * SNAP

const TIPOS = ['AUTO', 'MOTO', 'DISCAPACITADO', 'ELECTRICO']
const TV_COLOR = {
  AUTO:         '#5b7eff',
  MOTO:         '#a259ff',
  DISCAPACITADO:'#ffaa00',
  ELECTRICO:    '#3de8c8',
}
const ESTADO_COLOR = {
  DISPONIBLE:    '#3de8c8',
  RESERVADO:     '#a259ff',
  OCUPADO:       '#ffaa00',
  BLOQUEADO:     '#ff4d6d',
  MANTENIMIENTO: '#ff4d6d',
}

// ─────────────────────────────────────────────────────────────
// HELPERS UI
// ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, maxWidth = 440 }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'#00000085', display:'flex', alignItems:'center', justifyContent:'center', zIndex:600, padding:20 }}
      onClick={onClose}
    >
      <div
        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:24, width:'100%', maxWidth, boxShadow:'0 24px 60px #00000060' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:FF }}>{title}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, padding:4 }}>
            <X size={18}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize:12, fontWeight:600, color:C.muted, fontFamily:FF, marginBottom:6 }}>{label}</p>
      {children}
    </div>
  )
}

const inputSt = {
  width:'100%', padding:'9px 12px', borderRadius:9,
  background:C.s2, border:`1px solid ${C.border}`,
  color:C.text, fontSize:14, fontFamily:FF,
  boxSizing:'border-box', outline:'none',
}

function TipoBtn({ t, active, onClick }) {
  const color = TV_COLOR[t] || C.accent
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', borderRadius:7, cursor:'pointer', fontFamily:FF, background:active?color+'22':C.s2, border:`1px solid ${active?color:C.border}`, color:active?color:C.muted, fontSize:11, fontWeight:700 }}>
      {t}
    </button>
  )
}

function Btn({ children, onClick, disabled, ghost, danger, small, style={} }) {
  const base = {
    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    padding: small ? '6px 10px' : '10px 14px',
    borderRadius:9, cursor:disabled?'default':'pointer', border:'none',
    fontFamily:FF, fontSize: small ? 11 : 13, fontWeight:700,
    opacity:disabled?0.4:1,
  }
  const variant = ghost
    ? { background:C.s2, color:C.muted, border:`1px solid ${C.border}` }
    : danger
    ? { background:'#ff4d6d14', color:'#ff4d6d', border:'1px solid #ff4d6d25' }
    : { background:GRAD, color:'#fff' }
  return <button onClick={disabled?undefined:onClick} style={{...base,...variant,...style}}>{children}</button>
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function OperadorEditorMapa() {
  const { zonaId } = useParams()
  const navigate   = useNavigate()

  // Mapa
  const [zonaNombre,  setZonaNombre]  = useState('')
  const [mapaAncho,   setMapaAncho]   = useState(1200)
  const [mapaAlto,    setMapaAlto]    = useState(700)
  const [imagenFondo, setImagenFondo] = useState(null)
  const [espacios,    setEspacios]    = useState([])

  // UI
  const [loading,   setLoading]   = useState(true)
  const [selId,     setSelId]     = useState(null)
  const [toast,     setToast]     = useState(null)
  const [zoom,      setZoom]      = useState(1)

  // Modales
  const [mAutoGen, setMAutoGen] = useState(false)
  const [mAddEsp,  setMAddEsp]  = useState(false)
  const [mQr,      setMQr]      = useState(null)
  const [qrUrl,    setQrUrl]    = useState(null)

  // Formularios
  const [autoForm, setAutoForm] = useState({ columnas:'', filas:'', tipoVehiculo:'AUTO', margenX:'30', margenY:'30', espaciadoH:'12', espaciadoV:'12', espacioAncho:'52', espacioAlto:'72', reemplazar:true })
  const [addForm,  setAddForm]  = useState({ codigo:'', tipoVehiculo:'AUTO' })

  // Drag & resize refs
  const svgRef      = useRef(null)
  const containerRef= useRef(null)
  const dragRef     = useRef(null)   // { type:'move'|'resize', id, handle, startX,startY, origX,origY,origW,origH }
  const espaciosRef = useRef([])
  useEffect(() => { espaciosRef.current = espacios }, [espacios])

  // ── Zoom ─────────────────────────────────────────────────────────────
  const ZOOM_MIN = 0.3
  const ZOOM_MAX = 2.5
  const ZOOM_STEP = 0.15

  const zoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  const zoomFit = () => {
    if (!containerRef.current) return
    const cw = containerRef.current.clientWidth  - 48
    const ch = containerRef.current.clientHeight - 48
    setZoom(Math.min(cw / mapaAncho, ch / mapaAlto, 1))
  }

  // Fit on load
  useEffect(() => { if (!loading) setTimeout(zoomFit, 100) }, [loading, mapaAncho, mapaAlto])

  // ── Carga inicial ─────────────────────────────────────────────────────
  const cargarMapa = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auth.fetchAuth(`/api/operador/zonas/${zonaId}/mapa`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setZonaNombre(d.zonaNombre || '')
      setMapaAncho(d.mapaAncho  || 1200)
      setMapaAlto(d.mapaAlto    || 700)
      setImagenFondo(d.imagenFondo || null)
      setEspacios(d.espacios    || [])
    } catch {
      showToast('Error cargando mapa', 'error')
    } finally {
      setLoading(false)
    }
  }, [zonaId])

  useEffect(() => { cargarMapa() }, [cargarMapa])

  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  // ── SVG coordinate from mouse event (accounts for zoom) ──────────────
  const getSVGCoord = useCallback((e) => {
    if (!svgRef.current) return { x:0, y:0 }
    const rect   = svgRef.current.getBoundingClientRect()
    const scaleX = mapaAncho / rect.width
    const scaleY = mapaAlto  / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }, [mapaAncho, mapaAlto])

  // ── Global mouse handlers (drag + resize) ────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current || !svgRef.current) return
      const { type, id, handle, startX, startY, origX, origY, origW, origH } = dragRef.current
      const pt = getSVGCoord(e)
      const dx = pt.x - startX
      const dy = pt.y - startY

      setEspacios(prev => prev.map(esp => {
        if (esp.id !== id) return esp
        if (type === 'move') {
          return { ...esp, x: snapV(origX + dx), y: snapV(origY + dy) }
        }
        if (type === 'resize') {
          let { x, y, w, h } = { x: origX, y: origY, w: origW, h: origH }
          const MIN = 20
          switch (handle) {
            case 'se': w = Math.max(MIN, snapV(origW + dx)); h = Math.max(MIN, snapV(origH + dy)); break
            case 'sw': { const nw = Math.max(MIN, snapV(origW - dx)); x = snapV(origX + origW - nw); w = nw; h = Math.max(MIN, snapV(origH + dy)); break }
            case 'ne': w = Math.max(MIN, snapV(origW + dx)); { const nh = Math.max(MIN, snapV(origH - dy)); y = snapV(origY + origH - nh); h = nh; break }
            case 'nw': { const nw2 = Math.max(MIN, snapV(origW - dx)); x = snapV(origX + origW - nw2); w = nw2; const nh2 = Math.max(MIN, snapV(origH - dy)); y = snapV(origY + origH - nh2); h = nh2; break }
            case 'e': w = Math.max(MIN, snapV(origW + dx)); break
            case 's': h = Math.max(MIN, snapV(origH + dy)); break
          }
          return { ...esp, x, y, w, h }
        }
        return esp
      }))
    }

    const onUp = () => {
      if (!dragRef.current) return
      const { id } = dragRef.current
      dragRef.current = null
      const esp = espaciosRef.current.find(e => e.id === id)
      if (!esp) return
      auth.fetchAuth(`/api/operador/zonas/${zonaId}/espacios/${id}/posicion`, {
        method: 'PATCH',
        body: JSON.stringify({ x: esp.x, y: esp.y, w: esp.w, h: esp.h }),
      }).catch(() => showToast('Error guardando posición', 'error'))
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [zonaId, getSVGCoord])

  const startDrag = (e, esp, type, handle = null) => {
    e.preventDefault()
    e.stopPropagation()
    const pt = getSVGCoord(e)
    dragRef.current = {
      type, id: esp.id, handle,
      startX: pt.x, startY: pt.y,
      origX: esp.x || 0, origY: esp.y || 0,
      origW: esp.w || 52, origH: esp.h || 72,
    }
    setSelId(esp.id)
  }

  // ── Rotar 90° ────────────────────────────────────────────────────────
  const rotarEspacio = (esp) => {
    const cx = (esp.x || 0) + (esp.w || 52) / 2
    const cy = (esp.y || 0) + (esp.h || 72) / 2
    const nw = esp.h || 72
    const nh = esp.w || 52
    const nx = snapV(cx - nw / 2)
    const ny = snapV(cy - nh / 2)
    setEspacios(prev => prev.map(e => e.id === esp.id ? { ...e, x:nx, y:ny, w:nw, h:nh } : e))
    auth.fetchAuth(`/api/operador/zonas/${zonaId}/espacios/${esp.id}/posicion`, {
      method: 'PATCH',
      body: JSON.stringify({ x:nx, y:ny, w:nw, h:nh }),
    }).catch(() => showToast('Error guardando rotación', 'error'))
  }

  // Actualizar dimensión individualmente desde inputs del panel
  const actualizarDimension = (esp, campo, valor) => {
    const num = parseFloat(valor)
    if (isNaN(num) || num < 10) return
    const v = snapV(num)
    setEspacios(prev => prev.map(e => e.id === esp.id ? { ...e, [campo]:v } : e))
    const updated = { ...esp, [campo]:v }
    auth.fetchAuth(`/api/operador/zonas/${zonaId}/espacios/${esp.id}/posicion`, {
      method: 'PATCH',
      body: JSON.stringify({ x:updated.x, y:updated.y, w:updated.w, h:updated.h }),
    }).catch(() => showToast('Error guardando dimensión', 'error'))
  }

  // ── Upload imagen ────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result
      const img = new window.Image()
      img.onload = () => {
        const ratio   = img.naturalHeight / img.naturalWidth
        const newAlto = Math.round(mapaAncho * ratio)
        setImagenFondo(base64)
        setMapaAlto(newAlto)
        auth.fetchAuth(`/api/operador/zonas/${zonaId}/imagen-fondo`, {
          method: 'POST',
          body: JSON.stringify({ imagenBase64: base64, imageWidth: mapaAncho, imageHeight: newAlto }),
        })
          .then(r => { if (!r.ok) throw new Error() })
          .then(() => showToast('Imagen guardada'))
          .catch(() => showToast('Error guardando imagen', 'error'))
      }
      img.src = base64
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const quitarImagen = () => {
    setImagenFondo(null)
    auth.fetchAuth(`/api/operador/zonas/${zonaId}/imagen-fondo`, {
      method:'POST', body:JSON.stringify({ imagenBase64:'' }),
    }).catch(() => {})
    showToast('Imagen eliminada')
  }

  // ── Auto-generar ────────────────────────────────────────────────────
  const handleAutoGen = async () => {
    const body = {
      tipoVehiculo: autoForm.tipoVehiculo,
      reemplazar:   autoForm.reemplazar,
      margenX:      parseFloat(autoForm.margenX)      || 30,
      margenY:      parseFloat(autoForm.margenY)      || 30,
      espaciadoH:   parseFloat(autoForm.espaciadoH)   || 12,
      espaciadoV:   parseFloat(autoForm.espaciadoV)   || 12,
      espacioAncho: parseFloat(autoForm.espacioAncho) || 52,
      espacioAlto:  parseFloat(autoForm.espacioAlto)  || 72,
    }
    if (autoForm.columnas) body.columnas = parseInt(autoForm.columnas)
    if (autoForm.filas)    body.filas    = parseInt(autoForm.filas)
    try {
      const res = await auth.fetchAuth(`/api/operador/zonas/${zonaId}/generar-espacios`, {
        method:'POST', body:JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.mensaje||'Error') }
      const d = await res.json()
      setEspacios(d.espacios || [])
      setSelId(null)
      setMAutoGen(false)
      showToast(`${d.espacios?.length||0} espacios generados`)
    } catch (err) {
      showToast(err.message || 'Error generando espacios', 'error')
    }
  }

  // ── Añadir espacio ──────────────────────────────────────────────────
  const handleAddEsp = async () => {
    const codigo = addForm.codigo.trim().toUpperCase()
    if (!codigo) return
    try {
      const res = await auth.fetchAuth(`/api/operador/zonas/${zonaId}/espacios`, {
        method:'POST',
        body:JSON.stringify({ codigo, tipoVehiculo:addForm.tipoVehiculo, x:80, y:80, w:52, h:72 }),
      })
      const d = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(d.mensaje||'Error')
      setEspacios(prev => [...prev, d])
      setSelId(d.id)
      setMAddEsp(false)
      setAddForm({ codigo:'', tipoVehiculo:'AUTO' })
      showToast('Espacio añadido — arrástralo a su posición')
    } catch (err) {
      showToast(err.message||'Error añadiendo espacio', 'error')
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar espacio "${espacios.find(e=>e.id===id)?.codigo}"?`)) return
    try {
      const res = await auth.fetchAuth(`/api/operador/zonas/${zonaId}/espacios/${id}`, { method:'DELETE' })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.mensaje||'No se puede eliminar') }
      setEspacios(prev => prev.filter(e => e.id !== id))
      setSelId(null)
      showToast('Espacio eliminado')
    } catch (err) { showToast(err.message, 'error') }
  }

  // ── QR ──────────────────────────────────────────────────────────────
  const handleVerQr = async (esp) => {
    setMQr(esp); setQrUrl(null)
    try {
      const res = await auth.fetchAuth(`/api/operador/espacios/${esp.id}/qr-imagen`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setQrUrl(d.qrDataUrl)
    } catch { showToast('Error cargando QR', 'error') }
  }

  const downloadQr = () => {
    if (!qrUrl || !mQr) return
    const a = document.createElement('a')
    a.href = qrUrl; a.download = `qr-espacio-${mQr.codigo}.png`; a.click()
  }

  // ── Estado derivado ─────────────────────────────────────────────────
  const selEsp = espacios.find(e => e.id === selId)
  const HANDLE_SIZE = 8

  // Handles: [handle_id, cx_offset, cy_offset, cursor]
  const HANDLES = selEsp ? [
    ['nw', 0,           0,           'nw-resize'],
    ['ne', selEsp.w||52, 0,           'ne-resize'],
    ['sw', 0,           selEsp.h||72, 'sw-resize'],
    ['se', selEsp.w||52, selEsp.h||72, 'se-resize'],
    ['e',  selEsp.w||52, (selEsp.h||72)/2, 'e-resize'],
    ['s',  (selEsp.w||52)/2, selEsp.h||72, 's-resize'],
  ] : []

  // ── Render ──────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:C.bg, overflow:'hidden', fontFamily:FF }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/operador/zonas')} style={{ width:32, height:32, borderRadius:8, background:C.s2, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ArrowLeft size={15} color={C.muted}/>
          </button>
          <div>
            <p style={{ fontSize:10, color:C.muted }}>Editor de Zona</p>
            <p style={{ fontSize:15, fontWeight:800, color:C.text }}>{zonaNombre||`Zona ${zonaId}`}</p>
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={zoomOut} title="Alejar" style={{ width:30, height:30, borderRadius:7, background:C.s2, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ZoomOut size={14} color={C.muted}/>
          </button>
          <button onClick={zoomFit} style={{ padding:'4px 10px', borderRadius:7, background:C.s2, border:`1px solid ${C.border}`, color:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', minWidth:52, textAlign:'center', fontFamily:FF }}>
            {Math.round(zoom*100)}%
          </button>
          <button onClick={zoomIn} title="Acercar" style={{ width:30, height:30, borderRadius:7, background:C.s2, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ZoomIn size={14} color={C.muted}/>
          </button>

          <div style={{ width:1, height:20, background:C.border, margin:'0 4px' }}/>

          <div style={{ display:'flex', alignItems:'center', gap:5, background:imagenFondo?'#3de8c810':'transparent', border:imagenFondo?'1px solid #3de8c825':'none', borderRadius:8, padding:'4px 10px' }}>
            {imagenFondo && <Image size={12} color="#3de8c8"/>}
            <span style={{ fontSize:11, fontWeight:600, color:imagenFondo?'#3de8c8':C.muted }}>{espacios.length} espacios</span>
          </div>
          <button onClick={cargarMapa} style={{ width:30, height:30, borderRadius:8, background:C.s2, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <RefreshCw size={13} color={C.muted}/>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* ── Left toolbar ── */}
        <div style={{ width:188, background:C.surface, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'14px 10px', flexShrink:0, overflowY:'auto', gap:4 }}>

          <SectionLabel>Imagen de fondo</SectionLabel>
          <label style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 12px', borderRadius:9, background:imagenFondo?'#3de8c810':C.s2, border:`1px solid ${imagenFondo?'#3de8c830':C.border}`, cursor:'pointer', fontSize:12, fontWeight:600, color:imagenFondo?'#3de8c8':C.muted }}>
            <Upload size={13}/>
            {imagenFondo ? 'Cambiar plano' : 'Subir plano'}
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageUpload}/>
          </label>
          {imagenFondo && (
            <button onClick={quitarImagen} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:9, background:'#ff4d6d0c', border:'1px solid #ff4d6d25', cursor:'pointer', fontSize:11, fontWeight:600, color:'#ff4d6d' }}>
              <X size={11}/> Quitar imagen
            </button>
          )}

          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
            <SectionLabel>Espacios</SectionLabel>
            <button onClick={() => setMAutoGen(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:7, padding:'9px 12px', borderRadius:9, background:GRAD, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, color:'#fff', marginBottom:5 }}>
              <Grid size={13}/> Auto-generar
            </button>
            <button onClick={() => { setMAddEsp(true); setAddForm({ codigo:'', tipoVehiculo:'AUTO' }) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:7, padding:'9px 12px', borderRadius:9, background:C.s2, border:`1px solid ${C.border}`, cursor:'pointer', fontSize:12, fontWeight:600, color:C.muted }}>
              <Plus size={13}/> Añadir espacio
            </button>
          </div>

          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
            <SectionLabel>Tipos</SectionLabel>
            {Object.entries(TV_COLOR).map(([tipo, color]) => (
              <div key={tipo} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }}/>
                <span style={{ fontSize:10, color:C.muted }}>{tipo}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
            <SectionLabel>Cómo usar</SectionLabel>
            {[
              ['🖼️', 'Sube el plano como imagen de fondo'],
              ['⚡', '"Auto-generar" crea una grilla. Ajusta columnas, filas y márgenes para que coincida con el plano'],
              ['↖', 'Arrastra los bloques para reposicionarlos'],
              ['⬡', 'Arrastra las esquinas para redimensionar'],
              ['↻', 'Usa el botón "Girar 90°" para rotar un espacio'],
              ['📎', 'Clic en un espacio para ver su QR o eliminarlo'],
            ].map(([icon, text]) => (
              <div key={icon} style={{ display:'flex', gap:6, marginBottom:7 }}>
                <span style={{ fontSize:12, flexShrink:0 }}>{icon}</span>
                <span style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Canvas ── */}
        <div
          ref={containerRef}
          style={{ flex:1, overflow:'auto', background:'#03030a', position:'relative', cursor:'default' }}
          onClick={() => setSelId(null)}
        >
          {/* Zoom wrapper — centers the canvas */}
          <div style={{ display:'inline-block', padding:24, minWidth:'100%', minHeight:'100%', boxSizing:'border-box' }}>
            <div
              style={{ position:'relative', width:mapaAncho, height:mapaAlto, transform:`scale(${zoom})`, transformOrigin:'top left' }}
            >
              {/* Fondo: imagen */}
              {imagenFondo && (
                <img
                  src={imagenFondo}
                  alt="Plano"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'fill', pointerEvents:'none', borderRadius:4 }}
                />
              )}

              {/* Sin imagen: cuadrícula sutil */}
              {!imagenFondo && (
                <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle, ${C.border} 1px, transparent 1px)`, backgroundSize:'40px 40px', opacity:0.4, borderRadius:8, border:`1px solid ${C.border}` }}/>
              )}

              {/* SVG de interacción */}
              <svg
                ref={svgRef}
                viewBox={`0 0 ${mapaAncho} ${mapaAlto}`}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', userSelect:'none' }}
              >
                {espacios.map(esp => {
                  const x    = esp.x || 0
                  const y    = esp.y || 0
                  const w    = esp.w || 52
                  const h    = esp.h || 72
                  const isSel= esp.id === selId
                  const color= TV_COLOR[esp.tipoVehiculo] || C.accent
                  const stCol= ESTADO_COLOR[esp.estado]   || color
                  const fs   = Math.min(w, h) < 44 ? 8 : 10

                  return (
                    <g key={esp.id}>
                      {/* Sombra */}
                      <rect x={x+3} y={y+3} width={w-4} height={h-4} rx={7} fill="#000" opacity={0.25}/>

                      {/* Bloque principal — drag handle */}
                      <rect
                        x={x+1} y={y+1} width={w-2} height={h-2} rx={7}
                        fill={color+'1e'}
                        stroke={isSel ? '#ffffff' : color}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        style={{ cursor:'grab' }}
                        onMouseDown={ev => startDrag(ev, esp, 'move')}
                        onClick={ev => { ev.stopPropagation(); setSelId(esp.id) }}
                      />

                      {/* Punto estado */}
                      <circle cx={x+w-9} cy={y+9} r={4} fill={stCol} style={{ pointerEvents:'none' }}/>

                      {/* Código */}
                      <text x={x+w/2} y={y+h/2-4} textAnchor="middle" fontSize={fs} fontWeight={700} fill={color} fontFamily={FF} pointerEvents="none">
                        {esp.codigo}
                      </text>
                      {/* Tipo abreviado */}
                      <text x={x+w/2} y={y+h/2+fs+1} textAnchor="middle" fontSize={fs-2} fill={color+'99'} fontFamily={FF} pointerEvents="none">
                        {(esp.tipoVehiculo||'').slice(0,4)}
                      </text>

                      {/* Handles de resize — solo si seleccionado */}
                      {isSel && HANDLES.map(([handle, ox, oy, cur]) => (
                        <rect
                          key={handle}
                          x={x + ox - HANDLE_SIZE/2}
                          y={y + oy - HANDLE_SIZE/2}
                          width={HANDLE_SIZE}
                          height={HANDLE_SIZE}
                          rx={2}
                          fill="#fff"
                          stroke={color}
                          strokeWidth={1.5}
                          style={{ cursor:cur }}
                          onMouseDown={ev => startDrag(ev, esp, 'resize', handle)}
                        />
                      ))}
                    </g>
                  )
                })}

                {/* Vacío */}
                {espacios.length === 0 && (
                  <text x={mapaAncho/2} y={mapaAlto/2} textAnchor="middle" fontSize={14} fill={C.muted} fontFamily={FF} pointerEvents="none">
                    {imagenFondo ? 'Auto-genera o añade espacios individualmente' : 'Sube una imagen de plano para comenzar'}
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* ── Panel derecho: espacio seleccionado ── */}
        {selEsp && (
          <div style={{ width:230, background:C.surface, borderLeft:`1px solid ${C.border}`, padding:16, flexShrink:0, display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Espacio</p>
              <button onClick={() => setSelId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted }}>
                <X size={15}/>
              </button>
            </div>

            {/* Código */}
            <div style={{ background:C.s2, borderRadius:10, padding:'12px 14px' }}>
              <p style={{ fontSize:10, color:C.muted, marginBottom:2 }}>Código</p>
              <p style={{ fontSize:24, fontWeight:800, color:C.text }}>{selEsp.codigo}</p>
            </div>

            {/* Tipo */}
            <div>
              <p style={{ fontSize:10, color:C.muted, marginBottom:5 }}>Tipo de vehículo</p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:(TV_COLOR[selEsp.tipoVehiculo]||C.accent)+'18', border:`1px solid ${(TV_COLOR[selEsp.tipoVehiculo]||C.accent)}30`, borderRadius:8, padding:'4px 10px' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:TV_COLOR[selEsp.tipoVehiculo]||C.accent }}/>
                <span style={{ fontSize:12, fontWeight:700, color:TV_COLOR[selEsp.tipoVehiculo]||C.accent }}>{selEsp.tipoVehiculo}</span>
              </div>
            </div>

            {/* Estado */}
            <div>
              <p style={{ fontSize:10, color:C.muted, marginBottom:5 }}>Estado</p>
              <span style={{ fontSize:12, fontWeight:600, color:ESTADO_COLOR[selEsp.estado]||C.muted }}>● {selEsp.estado}</span>
            </div>

            {/* Posición editable */}
            <div style={{ background:C.s2, borderRadius:10, padding:'12px 14px' }}>
              <p style={{ fontSize:10, color:C.muted, marginBottom:10 }}>Posición y tamaño</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['x','X',selEsp.x],['y','Y',selEsp.y],['w','Ancho',selEsp.w],['h','Alto',selEsp.h]].map(([k,label,val]) => (
                  <div key={k}>
                    <p style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{label}</p>
                    <input
                      type="number"
                      defaultValue={Math.round(val||0)}
                      onBlur={e => actualizarDimension(selEsp, k, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && actualizarDimension(selEsp, k, e.target.value)}
                      style={{ ...inputSt, padding:'5px 8px', fontSize:12 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <p style={{ fontSize:10, color:C.muted, marginBottom:2 }}>Acciones rápidas</p>

              {/* Rotar */}
              <button
                onClick={() => rotarEspacio(selEsp)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'#5b7eff12', border:'1px solid #5b7eff28', cursor:'pointer', fontSize:12, fontWeight:600, color:C.accent }}
              >
                <RotateCcw size={14}/> Girar 90°
              </button>

              {/* QR */}
              <button
                onClick={() => handleVerQr(selEsp)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'#5b7eff0a', border:'1px solid #5b7eff18', cursor:'pointer', fontSize:12, fontWeight:600, color:C.accent }}
              >
                <QrCode size={14}/> Ver / Descargar QR
              </button>

              {/* Eliminar */}
              <button
                onClick={() => handleDelete(selEsp.id)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'#ff4d6d0c', border:'1px solid #ff4d6d22', cursor:'pointer', fontSize:12, fontWeight:600, color:'#ff4d6d' }}
              >
                <Trash2 size={14}/> Eliminar espacio
              </button>
            </div>

            {/* UUID */}
            <div style={{ background:'#5b7eff0a', border:'1px solid #5b7eff18', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ fontSize:10, color:C.muted, marginBottom:4 }}>UUID slot físico</p>
              <p style={{ fontSize:9, color:C.muted, wordBreak:'break-all', lineHeight:1.4 }}>{selEsp.codigoQr}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:toast.tipo==='success'?'#3de8c818':'#ff4d6d18', border:`1px solid ${toast.tipo==='success'?'#3de8c840':'#ff4d6d40'}`, color:toast.tipo==='success'?'#3de8c8':'#ff4d6d', padding:'11px 24px', borderRadius:10, fontFamily:FF, fontSize:14, fontWeight:600, zIndex:999, boxShadow:'0 4px 24px #00000050', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Modal: Auto-generar ── */}
      {mAutoGen && (
        <Modal title="Auto-generar espacios" onClose={() => setMAutoGen(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Tipo de vehículo">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {TIPOS.map(t => <TipoBtn key={t} t={t} active={autoForm.tipoVehiculo===t} onClick={() => setAutoForm(p=>({...p,tipoVehiculo:t}))}/>)}
              </div>
            </Field>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Columnas (vacío=auto)">
                <input type="number" min={1} placeholder="Auto" value={autoForm.columnas} onChange={e=>setAutoForm(p=>({...p,columnas:e.target.value}))} style={inputSt}/>
              </Field>
              <Field label="Filas (vacío=auto)">
                <input type="number" min={1} placeholder="Auto" value={autoForm.filas} onChange={e=>setAutoForm(p=>({...p,filas:e.target.value}))} style={inputSt}/>
              </Field>
            </div>

            <p style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>
              💡 Ajusta los márgenes y espaciados para que la grilla coincida con el plano de fondo.
            </p>

            <div style={{ background:C.s2, borderRadius:10, padding:'12px 14px' }}>
              <p style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:10 }}>Márgenes y dimensiones</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['margenX',     'Margen X'],
                  ['margenY',     'Margen Y'],
                  ['espaciadoH',  'Espaciado H'],
                  ['espaciadoV',  'Espaciado V'],
                  ['espacioAncho','Ancho bloque'],
                  ['espacioAlto', 'Alto bloque'],
                ].map(([k,label]) => (
                  <div key={k}>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{label}</p>
                    <input type="number" min={1} value={autoForm[k]} onChange={e=>setAutoForm(p=>({...p,[k]:e.target.value}))} style={{ ...inputSt, padding:'7px 10px', fontSize:12 }}/>
                  </div>
                ))}
              </div>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={autoForm.reemplazar} onChange={e=>setAutoForm(p=>({...p,reemplazar:e.target.checked}))} style={{ width:16, height:16, accentColor:C.accent }}/>
              <span style={{ fontSize:13, color:C.text }}>Eliminar espacios sin reservas activas</span>
            </label>

            <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'#ffaa0010', border:'1px solid #ffaa0025', borderRadius:9, padding:'10px 12px' }}>
              <AlertTriangle size={13} color="#ffaa00" style={{ marginTop:2, flexShrink:0 }}/>
              <p style={{ fontSize:11, color:'#ffaa00', lineHeight:1.5 }}>Los espacios con reservas activas no se eliminarán.</p>
            </div>

            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <Btn ghost onClick={() => setMAutoGen(false)}>Cancelar</Btn>
              <Btn onClick={handleAutoGen} style={{ flex:2 }}><Grid size={13}/> Generar espacios</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Añadir espacio ── */}
      {mAddEsp && (
        <Modal title="Añadir espacio" onClose={() => setMAddEsp(false)} maxWidth={380}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Código del espacio">
              <input
                autoFocus value={addForm.codigo}
                onChange={e=>setAddForm(p=>({...p,codigo:e.target.value.toUpperCase()}))}
                onKeyDown={e=>e.key==='Enter'&&handleAddEsp()}
                placeholder="ej. A-01" style={inputSt}
              />
            </Field>
            <Field label="Tipo de vehículo">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {TIPOS.map(t => <TipoBtn key={t} t={t} active={addForm.tipoVehiculo===t} onClick={() => setAddForm(p=>({...p,tipoVehiculo:t}))}/>)}
              </div>
            </Field>
            <p style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
              Aparecerá en la esquina superior izquierda. Arrástralo a su posición y redimensiónalo desde las esquinas.
            </p>
            <div style={{ display:'flex', gap:8 }}>
              <Btn ghost onClick={() => setMAddEsp(false)}>Cancelar</Btn>
              <Btn disabled={!addForm.codigo.trim()} onClick={handleAddEsp} style={{ flex:2 }}><Plus size={13}/> Añadir</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: QR ── */}
      {mQr && (
        <Modal title={`QR — ${mQr.codigo}`} onClose={() => { setMQr(null); setQrUrl(null) }} maxWidth={380}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            {qrUrl ? (
              <>
                <div style={{ background:'#fff', padding:16, borderRadius:14, boxShadow:'0 4px 24px #00000028' }}>
                  <img src={qrUrl} alt={`QR ${mQr.codigo}`} style={{ width:200, height:200, display:'block' }}/>
                </div>
                <div style={{ background:C.s2, borderRadius:10, padding:'10px 14px', textAlign:'center', width:'100%' }}>
                  <p style={{ fontSize:10, color:C.muted, marginBottom:3 }}>UUID del slot físico</p>
                  <p style={{ fontSize:10, fontWeight:600, color:C.text, wordBreak:'break-all', lineHeight:1.5 }}>{mQr.codigoQr}</p>
                </div>
                <p style={{ fontSize:12, color:C.muted, textAlign:'center', lineHeight:1.6 }}>
                  Imprime este QR y pégalo en el espacio físico <strong style={{ color:C.text }}>{mQr.codigo}</strong>.
                </p>
                <div style={{ display:'flex', gap:8, width:'100%' }}>
                  <Btn ghost onClick={() => { setMQr(null); setQrUrl(null) }}>Cerrar</Btn>
                  <Btn onClick={downloadQr} style={{ flex:2 }}><Download size={13}/> Descargar PNG</Btn>
                </div>
              </>
            ) : (
              <div style={{ padding:'32px 0', textAlign:'center' }}>
                <SpinnerSmall/>
                <p style={{ color:C.muted, fontSize:13, marginTop:12 }}>Generando QR…</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return <p style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:'0.12em', textTransform:'uppercase', padding:'2px 2px 4px', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{children}</p>
}

function SpinnerSmall() {
  return (
    <>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${C.border}`, borderTopColor:C.accent, animation:'spin 0.8s linear infinite', margin:'0 auto' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <SpinnerSmall/>
        <p style={{ color:C.muted, fontSize:14, marginTop:14 }}>Cargando editor…</p>
      </div>
    </div>
  )
}