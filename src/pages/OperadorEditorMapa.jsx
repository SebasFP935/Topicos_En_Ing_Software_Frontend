// src/pages/OperadorEditorMapa.jsx
//
// Editor profesional de zonas de parqueo
// Features:
//   - Rotación libre (drag handle circular) + snap a 15°/45°/90° con Shift
//   - Panel de propiedades en tiempo real (X, Y, W, H, Ángulo, Código, Tipo)
//   - Multi-selección con Shift+clic o recuadro de selección
//   - Undo / Redo  (Ctrl+Z / Ctrl+Y)
//   - Duplicar espacio (Ctrl+D)
//   - Zoom y Pan estilo Figma (rueda + Espacio+drag)
//   - Alinear y distribuir selección múltiple
//   - Líneas guía de snap a bordes de otros espacios
//   - Auto-generar grilla de espacios
//   - Imagen de fondo (plano real del parqueo)
//   - Guardar → PUT /api/zonas/{id}/mapa
//
// API:
//   GET  /api/zonas/{id}/mapa
//   PUT  /api/zonas/{id}/mapa

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, ZoomIn, ZoomOut, Maximize2,
  RotateCcw, RotateCw, Copy, Trash2, Upload, ImageOff,
  AlignLeft, AlignRight, AlignCenterHorizontal,
  AlignStartHorizontal, AlignEndHorizontal, AlignCenterVertical,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  Layers, Settings2, Plus,
  LayoutGrid, ChevronDown, ChevronUp, Undo2, Redo2,
  MousePointer2, Move, Zap, Car, Bike, Accessibility, Gauge, ParkingSquare,
} from 'lucide-react'
import { C, GRAD } from '../tokens'
import { auth } from '../utils/auth'

const FF = 'var(--ff-apple)'
const GRID = 10
const SNAP_ANGLE = 15      // grados al hacer snap con Shift
const GUIDE_THRESH = 8     // px para activar línea guía
const MIN_SIZE = 20
const HANDLE_R = 6         // radio de handle resize
const ROT_HANDLE_OFFSET = 24  // distancia del handle de rotación

const TV_COLOR = {
  AUTO:         '#0068b7',
  MOTO:         '#8d6bff',
  BICICLETA:    '#7ba5ff',
  DISCAPACIDAD: '#ffcc00',
  ELECTRICO:    '#b9c0cd',
}
const TV_ICON = { AUTO: Car, MOTO: Gauge, BICICLETA: Bike, DISCAPACIDAD: Accessibility, ELECTRICO: Zap }
const TV_GLYPH = { AUTO: 'A', MOTO: 'M', BICICLETA: 'B', DISCAPACIDAD: 'D', ELECTRICO: 'E' }
const TIPOS = ['AUTO', 'MOTO', 'BICICLETA', 'DISCAPACIDAD', 'ELECTRICO']

const snap = (v, g = GRID) => Math.round(v / g) * g
const uid  = () => 'tmp_' + Math.random().toString(36).slice(2, 9)
const deg  = rad => rad * 180 / Math.PI
const rad  = d => d * Math.PI / 180
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Obtener esquinas rotadas de un espacio
function getCorners(esp) {
  const cx = esp.x + esp.w / 2
  const cy = esp.y + esp.h / 2
  const a  = rad(esp.angulo || 0)
  const hw = esp.w / 2
  const hh = esp.h / 2
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return [
    { x: cx + (-hw * cos - -hh * sin), y: cy + (-hw * sin + -hh * cos) },
    { x: cx + ( hw * cos - -hh * sin), y: cy + ( hw * sin + -hh * cos) },
    { x: cx + ( hw * cos -  hh * sin), y: cy + ( hw * sin +  hh * cos) },
    { x: cx + (-hw * cos -  hh * sin), y: cy + (-hw * sin +  hh * cos) },
  ]
}

// AABB de un espacio rotado
function getBBox(esp) {
  if (!esp.angulo) return { x: esp.x, y: esp.y, x2: esp.x + esp.w, y2: esp.y + esp.h }
  const corners = getCorners(esp)
  const xs = corners.map(c => c.x)
  const ys = corners.map(c => c.y)
  return { x: Math.min(...xs), y: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }
}

// ── ToolButton ─────────────────────────────────────────────────────────────
function TB({ active, onClick, title, children, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: 12,
        background: active ? GRAD : danger ? C.danger + '18' : 'rgba(255,255,255,.02)',
        color: active ? '#fff' : danger ? C.danger : C.muted,
        border: `1px solid ${active ? 'transparent' : danger ? C.danger + '40' : C.border}`,
        cursor: 'pointer', transition: 'all .12s', flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── Separador de toolbar ───────────────────────────────────────────────────
const Sep = () => <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px' }} />

// ── Input numérico para el panel de propiedades ────────────────────────────
function NumInput({ label, value, onChange, unit = '', min, max, step = 1 }) {
  const [local, setLocal] = useState(String(value ?? ''))
  useEffect(() => setLocal(String(value ?? '')), [value])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
      <label style={{ fontSize: 10, color: C.muted, fontFamily: FF, fontWeight: 600, letterSpacing: .5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <input
          type="number"
          value={local}
          min={min} max={max} step={step}
          onChange={e => { setLocal(e.target.value) }}
          onBlur={() => {
            const n = parseFloat(local)
            if (!isNaN(n)) onChange(min !== undefined ? Math.max(min, n) : n)
            else setLocal(String(value ?? ''))
          }}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          style={{
            flex: 1, padding: '5px 8px', background: 'transparent',
            border: 'none', color: C.text, fontSize: 12, fontFamily: FF,
            outline: 'none', minWidth: 0,
          }}
        />
        {unit && <span style={{ fontSize: 10, color: C.muted, padding: '0 6px', fontFamily: FF }}>{unit}</span>}
      </div>
    </div>
  )
}

// ── Cargando ───────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(180deg, rgba(5,6,8,.74), rgba(5,6,8,.9))', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: C.muted, fontSize: 14, fontFamily: FF }}>Cargando editor…</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function OperadorEditorMapa() {
  const { zonaId }  = useParams()
  const navigate    = useNavigate()

  // ── Datos básicos ──────────────────────────────────────────────────────
  const [zonaNombre,   setZonaNombre]   = useState('')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [toast,        setToast]        = useState(null)
  const [hayCambios,   setHayCambios]   = useState(false)

  // ── Canvas ─────────────────────────────────────────────────────────────
  const [espacios,     setEspacios]     = useState([])
  const [imagenFondo,  setImagenFondo]  = useState(null)
  const [mapaAncho,    setMapaAncho]    = useState(1200)
  const [mapaAlto,     setMapaAlto]     = useState(700)

  // ── Selección ─────────────────────────────────────────────────────────
  const [selIds,       setSelIds]       = useState(new Set())   // multi-select
  const [tool,         setTool]         = useState('select')    // 'select' | 'draw' | 'pan'
  const [showAutoGen,  setShowAutoGen]  = useState(false)

  // ── Zoom & pan ─────────────────────────────────────────────────────────
  const [zoom,         setZoom]         = useState(1)
  const [pan,          setPan]          = useState({ x: 0, y: 0 })
  const [isPanning,    setIsPanning]    = useState(false)

  // ── Undo / Redo ────────────────────────────────────────────────────────
  const historyRef  = useRef([])
  const histIdxRef  = useRef(-1)
  const [canUndo,   setCanUndo]   = useState(false)
  const [canRedo,   setCanRedo]   = useState(false)

  // ── Drag state ─────────────────────────────────────────────────────────
  const dragRef     = useRef(null)
  const panRef      = useRef(null)
  const selBoxRef   = useRef(null)  // recuadro de selección
  const svgRef      = useRef(null)
  const containerRef= useRef(null)

  // ── Snap guides + selection box ────────────────────────────────────────
  const [guides,       setGuides]       = useState([])   // [{type:'v'|'h', pos}]
  const [selBox,       setSelBox]       = useState(null) // {x0,y0,x1,y1} rendered rect

  // ── Auto-gen form ──────────────────────────────────────────────────────
  const [autoForm, setAutoForm] = useState({
    prefijo: 'A', columnas: '', filas: '',
    espacioAncho: '52', espacioAlto: '72',
    espaciadoH: '10', espaciadoV: '10',
    margenX: '30', margenY: '30',
    tipo: 'AUTO', angulo: '0', reemplazar: false,
  })

  // ── propiedades del espacio seleccionado ───────────────────────────────
  const selArr = useMemo(() => espacios.filter(e => selIds.has(e.id)), [espacios, selIds])
  const selOne = selArr.length === 1 ? selArr[0] : null

  // ── Toast ─────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Undo / Redo helpers ────────────────────────────────────────────────
  const pushHistory = useCallback((state) => {
    const idx = histIdxRef.current
    historyRef.current = historyRef.current.slice(0, idx + 1)
    historyRef.current.push(JSON.parse(JSON.stringify(state)))
    histIdxRef.current = historyRef.current.length - 1
    setCanUndo(histIdxRef.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (histIdxRef.current <= 0) return
    histIdxRef.current--
    const state = historyRef.current[histIdxRef.current]
    setEspacios(state)
    setSelIds(new Set())
    setCanUndo(histIdxRef.current > 0)
    setCanRedo(true)
    setHayCambios(true)
  }, [])

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1) return
    histIdxRef.current++
    const state = historyRef.current[histIdxRef.current]
    setEspacios(state)
    setSelIds(new Set())
    setCanUndo(true)
    setCanRedo(histIdxRef.current < historyRef.current.length - 1)
    setHayCambios(true)
  }, [])

  const commitChange = useCallback((newEspacios) => {
    setEspacios(newEspacios)
    pushHistory(newEspacios)
    setHayCambios(true)
  }, [pushHistory])

  // ── Cargar mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    auth.fetchAuth(`/api/zonas/${zonaId}/mapa`)
      .then(r => r.json())
      .then(data => {
        setZonaNombre(data.zonaNombre || '')
        setMapaAncho(data.mapaAncho || 1200)
        setMapaAlto(data.mapaAlto || 700)
        setImagenFondo(data.planoImagen || null)
        const esps = (data.espacios || []).map(e => ({ ...e, angulo: e.angulo || 0 }))
        setEspacios(esps)
        pushHistory(esps)
      })
      .catch(() => {
        setEspacios([])
        pushHistory([])
      })
      .finally(() => setLoading(false))
  }, [zonaId, pushHistory])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicarSel(); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { eliminarSel(); return }
      if (e.key === ' ') { e.preventDefault(); setTool(t => t === 'pan' ? 'select' : 'pan'); return }
      if (e.key === 'Escape') { setSelIds(new Set()); return }
      if (e.key === 'v') setTool('select')
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSelIds(new Set(espacios.map(e => e.id))); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [espacios, undo, redo]) // eslint-disable-line

  // ── Coordenadas SVG desde evento ───────────────────────────────────────
  const getSVGCoord = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top  - pan.y) / zoom,
    }
  }, [pan, zoom])

  // ── Calcular guías de snap ─────────────────────────────────────────────
  const calcGuides = useCallback((movingIds, newEspacios) => {
    const moving = newEspacios.filter(e => movingIds.has(e.id))
    const still  = newEspacios.filter(e => !movingIds.has(e.id))
    const guides = []
    moving.forEach(mv => {
      const bb = getBBox(mv)
      still.forEach(st => {
        const sb = getBBox(st)
        const pts = [
          { type: 'v', pos: sb.x,              ref: bb.x  },
          { type: 'v', pos: sb.x2,             ref: bb.x  },
          { type: 'v', pos: (sb.x+sb.x2)/2,   ref: (bb.x+bb.x2)/2 },
          { type: 'h', pos: sb.y,              ref: bb.y  },
          { type: 'h', pos: sb.y2,             ref: bb.y  },
          { type: 'h', pos: (sb.y+sb.y2)/2,   ref: (bb.y+bb.y2)/2 },
        ]
        pts.forEach(p => {
          if (Math.abs(p.pos - p.ref) < GUIDE_THRESH / zoom)
            guides.push({ type: p.type, pos: p.pos })
        })
      })
    })
    setGuides(guides)
  }, [zoom])

  // ── Mouse Down en canvas ───────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button === 1 || tool === 'pan') {
      // Middle click o herramienta pan
      panRef.current = { startX: e.clientX - pan.x, startY: e.clientY - pan.y }
      setIsPanning(true)
      return
    }
    if (tool === 'draw') return  // handled by rect draw

    const pt = getSVGCoord(e)

    // ¿Tocó algún espacio?
    const hit = [...espacios].reverse().find(esp => {
      const cx = esp.x + esp.w / 2
      const cy = esp.y + esp.h / 2
      const a  = -rad(esp.angulo || 0)
      const dx = pt.x - cx
      const dy = pt.y - cy
      const lx = dx * Math.cos(a) - dy * Math.sin(a)
      const ly = dx * Math.sin(a) + dy * Math.cos(a)
      return Math.abs(lx) <= esp.w / 2 && Math.abs(ly) <= esp.h / 2
    })

    if (hit) {
      // Actualizar selección
      if (e.shiftKey) {
        setSelIds(prev => {
          const next = new Set(prev)
          next.has(hit.id) ? next.delete(hit.id) : next.add(hit.id)
          return next
        })
      } else {
        if (!selIds.has(hit.id)) setSelIds(new Set([hit.id]))
      }
      // Preparar drag move
      const snapshots = {}
      espacios.forEach(esp => { snapshots[esp.id] = { x: esp.x, y: esp.y } })
      dragRef.current = {
        type: 'move',
        startX: pt.x, startY: pt.y,
        snapshots,
        ids: e.shiftKey
          ? (selIds.has(hit.id) ? [...selIds].filter(id => id !== hit.id) : [...selIds, hit.id])
          : (selIds.has(hit.id) ? [...selIds] : [hit.id]),
      }
    } else {
      // Clic en vacío → deseleccionar o iniciar recuadro
      if (!e.shiftKey) setSelIds(new Set())
      selBoxRef.current = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y }
    }
  }, [tool, pan, getSVGCoord, espacios, selIds])

  // ── Mouse Move global ──────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      // Pan
      if (isPanning && panRef.current) {
        setPan({ x: e.clientX - panRef.current.startX, y: e.clientY - panRef.current.startY })
        return
      }
      // Drag move
      if (dragRef.current?.type === 'move') {
        const pt = getSVGCoord(e)
        const dx = pt.x - dragRef.current.startX
        const dy = pt.y - dragRef.current.startY
        const ids = new Set(dragRef.current.ids)
        setEspacios(prev => {
          const next = prev.map(esp => {
            if (!ids.has(esp.id)) return esp
            const orig = dragRef.current.snapshots[esp.id]
            return { ...esp, x: snap(orig.x + dx), y: snap(orig.y + dy) }
          })
          calcGuides(ids, next)
          return next
        })
        return
      }
      // Drag rotate
      if (dragRef.current?.type === 'rotate') {
        const pt = getSVGCoord(e)
        const { cx, cy, id } = dragRef.current
        let angle = deg(Math.atan2(pt.y - cy, pt.x - cx)) + 90
        if (e.shiftKey) angle = Math.round(angle / SNAP_ANGLE) * SNAP_ANGLE
        angle = ((angle % 360) + 360) % 360
        setEspacios(prev => prev.map(esp => esp.id === id ? { ...esp, angulo: Math.round(angle) } : esp))
        return
      }
      // Drag resize
      if (dragRef.current?.type === 'resize') {
        const pt = getSVGCoord(e)
        const { handle, id, origX, origY, origW, origH, startX, startY } = dragRef.current
        const dx = pt.x - startX
        const dy = pt.y - startY
        setEspacios(prev => prev.map(esp => {
          if (esp.id !== id) return esp
          let { x, y, w, h } = { x: origX, y: origY, w: origW, h: origH }
          if (handle.includes('e')) { w = Math.max(MIN_SIZE, snap(origW + dx)) }
          if (handle.includes('s')) { h = Math.max(MIN_SIZE, snap(origH + dy)) }
          if (handle.includes('w')) { const nw = Math.max(MIN_SIZE, snap(origW - dx)); x = origX + origW - nw; w = nw }
          if (handle.includes('n')) { const nh = Math.max(MIN_SIZE, snap(origH - dy)); y = origY + origH - nh; h = nh }
          return { ...esp, x, y, w, h }
        }))
        return
      }
      // Recuadro de selección
      if (selBoxRef.current) {
        const pt = getSVGCoord(e)
        selBoxRef.current = { ...selBoxRef.current, x1: pt.x, y1: pt.y }
        setSelBox({ ...selBoxRef.current })
        // Highlight en tiempo real
        const { x0, y0, x1, y1 } = selBoxRef.current
        const rx = Math.min(x0, x1), ry = Math.min(y0, y1)
        const rw = Math.abs(x1 - x0), rh = Math.abs(y1 - y0)
        if (rw > 4 || rh > 4) {
          const inBox = espacios.filter(esp => {
            const bb = getBBox(esp)
            return bb.x >= rx && bb.x2 <= rx + rw && bb.y >= ry && bb.y2 <= ry + rh
          })
          setSelIds(new Set(inBox.map(e => e.id)))
        }
      }
    }
    const onUp = (e) => {
      if (isPanning) { setIsPanning(false); panRef.current = null; return }
      if (dragRef.current?.type === 'move') {
        setGuides([])
        commitChange([...espacios])
      }
      if (dragRef.current?.type === 'rotate' || dragRef.current?.type === 'resize') {
        commitChange([...espacios])
      }
      dragRef.current = null
      selBoxRef.current = null
      setSelBox(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning, getSVGCoord, espacios, commitChange, calcGuides])

  // ── Zoom con rueda ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return  // solo con ctrl/cmd
      e.preventDefault()
      const delta = -e.deltaY * 0.001
      setZoom(z => clamp(z * (1 + delta), 0.15, 5))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── Rueda sin ctrl → pan ───────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) return
    setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
  }, [])

  // ── Iniciar handle rotate ──────────────────────────────────────────────
  const startRotate = useCallback((e, esp) => {
    e.stopPropagation()
    dragRef.current = {
      type: 'rotate',
      id: esp.id,
      cx: esp.x + esp.w / 2,
      cy: esp.y + esp.h / 2,
    }
  }, [])

  // ── Iniciar handle resize ──────────────────────────────────────────────
  const startResize = useCallback((e, esp, handle) => {
    e.stopPropagation()
    dragRef.current = {
      type: 'resize', id: esp.id, handle,
      startX: getSVGCoord(e).x,
      startY: getSVGCoord(e).y,
      origX: esp.x, origY: esp.y,
      origW: esp.w, origH: esp.h,
    }
  }, [getSVGCoord])

  // ── Herramientas de edición ────────────────────────────────────────────
  const eliminarSel = useCallback(() => {
    if (selIds.size === 0) return
    commitChange(espacios.filter(e => !selIds.has(e.id)))
    setSelIds(new Set())
  }, [espacios, selIds, commitChange])

  const duplicarSel = useCallback(() => {
    if (selIds.size === 0) return
    const nuevos = espacios
      .filter(e => selIds.has(e.id))
      .map(e => ({ ...e, id: uid(), x: e.x + 20, y: e.y + 20, codigo: e.codigo + '_copia' }))
    const next = [...espacios, ...nuevos]
    commitChange(next)
    setSelIds(new Set(nuevos.map(e => e.id)))
  }, [espacios, selIds, commitChange])

  const rotar = useCallback((delta) => {
    if (selIds.size === 0) return
    commitChange(espacios.map(e =>
      selIds.has(e.id) ? { ...e, angulo: (((e.angulo || 0) + delta) % 360 + 360) % 360 } : e
    ))
  }, [espacios, selIds, commitChange])

  // ── Alinear selección ──────────────────────────────────────────────────
  const alinear = useCallback((tipo) => {
    if (selArr.length < 2) return
    const bboxes = selArr.map(e => ({ id: e.id, bb: getBBox(e), e }))
    const minX  = Math.min(...bboxes.map(b => b.bb.x))
    const maxX2 = Math.max(...bboxes.map(b => b.bb.x2))
    const minY  = Math.min(...bboxes.map(b => b.bb.y))
    const maxY2 = Math.max(...bboxes.map(b => b.bb.y2))
    const midX  = (minX + maxX2) / 2
    const midY  = (minY + maxY2) / 2

    commitChange(espacios.map(esp => {
      const b = bboxes.find(b => b.id === esp.id)
      if (!b) return esp
      const bb = b.bb
      let { x, y } = esp
      if (tipo === 'left')    x = esp.x + (minX - bb.x)
      if (tipo === 'right')   x = esp.x + (maxX2 - bb.x2)
      if (tipo === 'centerH') x = esp.x + (midX - (bb.x + bb.x2) / 2)
      if (tipo === 'top')     y = esp.y + (minY - bb.y)
      if (tipo === 'bottom')  y = esp.y + (maxY2 - bb.y2)
      if (tipo === 'centerV') y = esp.y + (midY - (bb.y + bb.y2) / 2)
      return { ...esp, x: snap(x), y: snap(y) }
    }))
  }, [espacios, selArr, commitChange])

  const distribuir = useCallback((dir) => {
    if (selArr.length < 3) return
    const sorted = [...selArr].sort((a, b) => dir === 'h' ? a.x - b.x : a.y - b.y)
    const first = sorted[0], last = sorted[sorted.length - 1]
    const totalGap = dir === 'h'
      ? (last.x + last.w) - first.x - sorted.reduce((s, e) => s + e.w, 0)
      : (last.y + last.h) - first.y - sorted.reduce((s, e) => s + e.h, 0)
    const gap = totalGap / (sorted.length - 1)
    let cursor = dir === 'h' ? first.x + first.w : first.y + first.h
    const newPositions = {}
    sorted.slice(1, -1).forEach(e => {
      newPositions[e.id] = dir === 'h' ? { x: snap(cursor + gap) } : { y: snap(cursor + gap) }
      cursor += (dir === 'h' ? e.w : e.h) + gap
    })
    commitChange(espacios.map(e => ({ ...e, ...(newPositions[e.id] || {}) })))
  }, [espacios, selArr, commitChange])

  // ── Actualizar propiedad individual ───────────────────────────────────
  const updateProp = useCallback((id, field, val) => {
    commitChange(espacios.map(e => e.id === id ? { ...e, [field]: val } : e))
  }, [espacios, commitChange])

  // ── Upload imagen ──────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      const img = new window.Image()
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth
        setImagenFondo(b64)
        setMapaAlto(Math.round(mapaAncho * ratio))
        setHayCambios(true)
        showToast('Imagen cargada')
      }
      img.src = b64
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Auto-generar ───────────────────────────────────────────────────────
  const handleAutoGen = () => {
    const mX = parseFloat(autoForm.margenX)      || 30
    const mY = parseFloat(autoForm.margenY)      || 30
    const eH = parseFloat(autoForm.espaciadoH)   || 10
    const eV = parseFloat(autoForm.espaciadoV)   || 10
    const ew = parseFloat(autoForm.espacioAncho) || 52
    const eh = parseFloat(autoForm.espacioAlto)  || 72
    const ang = parseFloat(autoForm.angulo) || 0
    const cols = autoForm.columnas ? parseInt(autoForm.columnas)
      : Math.max(1, Math.floor((mapaAncho - 2 * mX + eH) / (ew + eH)))
    const rows = autoForm.filas ? parseInt(autoForm.filas)
      : Math.max(1, Math.floor((mapaAlto - 2 * mY + eV) / (eh + eV)))

    const base = autoForm.reemplazar ? [] : espacios
    const existentes = base.length
    const nuevos = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = existentes + r * cols + c + 1
        nuevos.push({
          id: uid(),
          codigo: `${autoForm.prefijo}${String(n).padStart(2, '0')}`,
          tipoVehiculo: autoForm.tipo,
          estado: 'DISPONIBLE',
          x: snap(mX + c * (ew + eH)),
          y: snap(mY + r * (eh + eV)),
          w: ew, h: eh, angulo: ang,
        })
      }
    }
    commitChange([...base, ...nuevos])
    setSelIds(new Set(nuevos.map(e => e.id)))
    setShowAutoGen(false)
    showToast(`${nuevos.length} espacios generados`)
  }

  // ── Guardar ────────────────────────────────────────────────────────────
  const guardar = async () => {
    setSaving(true)
    try {
      const payload = {
        mapaAncho, mapaAlto,
        planoImagen: imagenFondo || null,
        plano: [],
        espacios: espacios.map(e => ({
          id:           typeof e.id === 'string' ? null : e.id,
          codigo:       e.codigo,
          tipoVehiculo: e.tipoVehiculo,
          x: Number(e.x || 0),
          y: Number(e.y || 0),
          w: Number(e.w || 52),
          h: Number(e.h || 72),
          angulo: Number(e.angulo || 0),
        })),
      }
      const res = await auth.fetchAuth(`/api/zonas/${zonaId}/mapa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await auth.readJson(res, {})
        throw new Error(auth.message(err?.mensaje, 'Error al guardar'))
      }
      const data = await auth.readJson(res, {})
      const esps = (data.espacios || []).map(e => ({ ...e, angulo: e.angulo || 0 }))
      setEspacios(esps)
      setImagenFondo(data.planoImagen || null)
      setHayCambios(false)
      showToast('Mapa guardado ✓')
    } catch (err) {
      showToast(auth.message(err?.message, 'Error al guardar'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Cursor según herramienta / estado ──────────────────────────────────
  const cursor = isPanning ? 'grabbing' : tool === 'pan' ? 'grab' : tool === 'draw' ? 'crosshair' : 'default'

  if (loading) return <Loading />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'linear-gradient(180deg, rgba(5,6,8,.72), rgba(5,6,8,.9))', overflow: 'hidden', fontFamily: FF }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '11px 24px', borderRadius: 12, fontFamily: FF,
          fontSize: 13, fontWeight: 600, pointerEvents: 'none',
          background: toast.tipo === 'error' ? C.danger : C.teal,
          color: toast.tipo === 'error' ? '#fff' : '#06060f',
          boxShadow: '0 8px 32px #00000060',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', background: 'linear-gradient(180deg, rgba(11,13,17,.94), rgba(11,13,17,.82))',
        borderBottom: `1px solid ${C.border}`, flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Volver */}
        <button
          onClick={() => {
            if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Salir?')) return
            navigate('/operador/zonas')
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: FF, padding: '4px 8px', borderRadius: 8 }}
        >
          <ArrowLeft size={16} /> Zonas
        </button>

        <div style={{ width: 1, height: 20, background: C.border }} />

        {/* Nombre zona */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5 }}>EDITOR DE ZONA</span>
          <span style={{ fontSize: 14, color: C.text, fontWeight: 700 }}>{zonaNombre}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* ── Toolbar herramientas ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '4px 6px' }}>
          <TB active={tool === 'select'} onClick={() => setTool('select')} title="Seleccionar (V)">
            <MousePointer2 size={16} />
          </TB>
          <TB active={tool === 'pan'} onClick={() => setTool(t => t === 'pan' ? 'select' : 'pan')} title="Mover vista (Espacio)">
            <Move size={16} />
          </TB>
          <Sep />
          <TB active={false} onClick={undo} title="Deshacer (Ctrl+Z)" danger={false}>
            <Undo2 size={16} style={{ opacity: canUndo ? 1 : .35 }} />
          </TB>
          <TB active={false} onClick={redo} title="Rehacer (Ctrl+Y)">
            <Redo2 size={16} style={{ opacity: canRedo ? 1 : .35 }} />
          </TB>
          <Sep />
          <TB active={false} onClick={duplicarSel} title="Duplicar (Ctrl+D)">
            <Copy size={16} style={{ opacity: selIds.size > 0 ? 1 : .35 }} />
          </TB>
          <TB active={false} onClick={eliminarSel} title="Eliminar (Supr)" danger>
            <Trash2 size={16} style={{ opacity: selIds.size > 0 ? 1 : .35 }} />
          </TB>
          <Sep />
          <TB active={false} onClick={() => rotar(-90)} title="Rotar -90°">
            <RotateCcw size={16} style={{ opacity: selIds.size > 0 ? 1 : .35 }} />
          </TB>
          <TB active={false} onClick={() => rotar(90)} title="Rotar +90°">
            <RotateCw size={16} style={{ opacity: selIds.size > 0 ? 1 : .35 }} />
          </TB>
        </div>

        {/* ── Align toolbar (solo con multi-selección) ── */}
        {selArr.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.s2, border: `1px solid ${C.accent}40`, borderRadius: 10, padding: '4px 6px' }}>
            <TB onClick={() => alinear('left')} title="Alinear izquierda"><AlignLeft size={16} /></TB>
            <TB onClick={() => alinear('centerH')} title="Centrar horizontal"><AlignCenterHorizontal size={16} /></TB>
            <TB onClick={() => alinear('right')} title="Alinear derecha"><AlignRight size={16} /></TB>
            <Sep />
            <TB onClick={() => alinear('top')} title="Alinear arriba"><AlignStartHorizontal size={16} /></TB>
            <TB onClick={() => alinear('centerV')} title="Centrar vertical"><AlignCenterVertical size={16} /></TB>
            <TB onClick={() => alinear('bottom')} title="Alinear abajo"><AlignEndHorizontal size={16} /></TB>
            {selArr.length >= 3 && (
              <>
                <Sep />
                <TB onClick={() => distribuir('h')} title="Distribuir horizontal"><AlignHorizontalDistributeCenter size={16} /></TB>
                <TB onClick={() => distribuir('v')} title="Distribuir vertical">
                  <AlignVerticalDistributeCenter size={16} />
                </TB>
              </>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TB onClick={() => setZoom(z => clamp(z / 1.25, .15, 5))} title="Alejar"><ZoomOut size={16} /></TB>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            style={{ fontSize: 12, fontWeight: 700, color: C.muted, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FF, minWidth: 54, textAlign: 'center' }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <TB onClick={() => setZoom(z => clamp(z * 1.25, .15, 5))} title="Acercar"><ZoomIn size={16} /></TB>
          <TB onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} title="Restablecer vista"><Maximize2 size={16} /></TB>
        </div>

        {/* Guardar */}
        <button
          onClick={guardar}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 10,
            background: hayCambios ? GRAD : C.s2,
            border: hayCambios ? 'none' : `1px solid ${C.border}`,
            color: hayCambios ? '#fff' : C.muted,
            fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            fontFamily: FF, transition: 'all .2s',
          }}
        >
          <Save size={15} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Panel Izquierdo ── */}
        <div style={{
          width: 270, background: 'linear-gradient(180deg, rgba(11,13,17,.95), rgba(11,13,17,.82))', borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
        }}>
          {/* Imagen de fondo */}
          <Section title="IMAGEN DE FONDO" icon={<Layers size={12} />}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              background: C.s2, border: `1px dashed ${C.border}`,
              fontSize: 12, color: C.muted, fontFamily: FF, fontWeight: 600,
            }}>
              <Upload size={13} /> {imagenFondo ? 'Cambiar plano' : 'Subir plano'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            {imagenFondo && (
              <button
                onClick={() => { setImagenFondo(null); setHayCambios(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: C.danger + '14', border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FF, marginTop: 6, width: '100%' }}
              >
                <ImageOff size={13} /> Quitar imagen
              </button>
            )}
          </Section>

          {/* Auto-generar */}
          <Section title="ESPACIOS" icon={<LayoutGrid size={12} />}>
            <button
              onClick={() => setShowAutoGen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 10px', borderRadius: 8,
                background: GRAD, border: 'none', color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={13} /> Auto-generar
              </span>
              {showAutoGen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAutoGen && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <NumInput label="Cols" value={autoForm.columnas} onChange={v => setAutoForm(f => ({ ...f, columnas: v }))} min={1} />
                  <NumInput label="Filas" value={autoForm.filas} onChange={v => setAutoForm(f => ({ ...f, filas: v }))} min={1} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <NumInput label="Ancho px" value={autoForm.espacioAncho} onChange={v => setAutoForm(f => ({ ...f, espacioAncho: v }))} min={20} />
                  <NumInput label="Alto px" value={autoForm.espacioAlto} onChange={v => setAutoForm(f => ({ ...f, espacioAlto: v }))} min={20} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <NumInput label="Sep H" value={autoForm.espaciadoH} onChange={v => setAutoForm(f => ({ ...f, espaciadoH: v }))} min={0} />
                  <NumInput label="Sep V" value={autoForm.espaciadoV} onChange={v => setAutoForm(f => ({ ...f, espaciadoV: v }))} min={0} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <NumInput label="Margen X" value={autoForm.margenX} onChange={v => setAutoForm(f => ({ ...f, margenX: v }))} min={0} />
                  <NumInput label="Margen Y" value={autoForm.margenY} onChange={v => setAutoForm(f => ({ ...f, margenY: v }))} min={0} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <NumInput label="Ángulo °" value={autoForm.angulo} onChange={v => setAutoForm(f => ({ ...f, angulo: v }))} min={0} max={359} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5 }}>PREFIJO</label>
                    <input
                      value={autoForm.prefijo}
                      onChange={e => setAutoForm(f => ({ ...f, prefijo: e.target.value }))}
                      maxLength={3}
                      style={{ padding: '5px 8px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: FF, outline: 'none' }}
                    />
                  </div>
                </div>
                {/* Tipo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5 }}>TIPO VEHÍCULO</label>
                  <select
                    value={autoForm.tipo}
                    onChange={e => setAutoForm(f => ({ ...f, tipo: e.target.value }))}
                    style={{ padding: '5px 8px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: FF, outline: 'none' }}
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoForm.reemplazar} onChange={e => setAutoForm(f => ({ ...f, reemplazar: e.target.checked }))} />
                  Reemplazar existentes
                </label>
                <button
                  onClick={handleAutoGen}
                  style={{ padding: '8px', borderRadius: 8, background: GRAD, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}
                >
                  <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Generar espacios
                </button>
              </div>
            )}

            {/* Stats */}
            <div style={{ marginTop: 10, padding: '8px 10px', background: C.s2, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: FF, marginBottom: 4 }}>Total espacios</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FF }}>{espacios.length}</div>
              {selIds.size > 0 && (
                <div style={{ fontSize: 11, color: C.accent, fontFamily: FF, marginTop: 2 }}>
                  {selIds.size} seleccionado{selIds.size > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </Section>

          {/* Tipos leyenda */}
          <Section title="TIPOS" icon={<Settings2 size={12} />}>
            {TIPOS.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: TV_COLOR[t] + '30', border: `1.5px solid ${TV_COLOR[t]}` }} />
                <span style={{ fontSize: 11, color: C.muted, fontFamily: FF, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const Icon = TV_ICON[t] || ParkingSquare
                    return <Icon size={12} />
                  })()}
                  {t}
                </span>
              </div>
            ))}
          </Section>

          {/* Atajos de teclado */}
          <Section title="ATAJOS" icon={<Settings2 size={12} />} collapsible defaultOpen={false}>
            {[
              ['V', 'Seleccionar'],
              ['Espacio', 'Mover vista'],
              ['Ctrl+Z', 'Deshacer'],
              ['Ctrl+Y', 'Rehacer'],
              ['Ctrl+D', 'Duplicar'],
              ['Ctrl+A', 'Sel. todos'],
              ['Supr', 'Eliminar'],
              ['Shift+drag', 'Multiselección'],
              ['Ctrl+rueda', 'Zoom'],
              ['Shift+rotar', 'Snap 15°'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: FF }}>{v}</span>
                <code style={{ fontSize: 10, color: C.accent, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{k}</code>
              </div>
            ))}
          </Section>
        </div>

        {/* ── Canvas ── */}
        <div
          ref={containerRef}
          onWheel={onWheel}
          style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'rgba(10,11,26,.82)', cursor }}
        >
          {/* Dot grid background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="dotgrid" x={pan.x % (GRID * zoom)} y={pan.y % (GRID * zoom)} width={GRID * zoom} height={GRID * zoom} patternUnits="userSpaceOnUse">
                <circle cx={GRID * zoom / 2} cy={GRID * zoom / 2} r={.8} fill={C.border} opacity=".6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {/* Canvas SVG */}
          <svg
            ref={svgRef}
            style={{
              position: 'absolute',
              left: pan.x, top: pan.y,
              width: mapaAncho * zoom,
              height: mapaAlto * zoom,
              display: 'block',
              borderRadius: 6,
              boxShadow: '0 0 0 1px rgba(255,255,255,.06), 0 20px 60px rgba(0,0,0,.6)',
              cursor,
            }}
            viewBox={`0 0 ${mapaAncho} ${mapaAlto}`}
            onMouseDown={onMouseDown}
          >
            {/* Fondo del canvas */}
            <rect x={0} y={0} width={mapaAncho} height={mapaAlto} fill={C.surface} />

            {/* Imagen de fondo */}
            {imagenFondo && (
              <image href={imagenFondo} x={0} y={0} width={mapaAncho} height={mapaAlto} preserveAspectRatio="xMidYMid meet" opacity={0.7} />
            )}

            {/* Líneas guía de snap */}
            {guides.map((g, i) =>
              g.type === 'v'
                ? <line key={i} x1={g.pos} y1={0} x2={g.pos} y2={mapaAlto} stroke="#7ba5ff" strokeWidth={.8} strokeDasharray="4 3" opacity={.7} />
                : <line key={i} x1={0} y1={g.pos} x2={mapaAncho} y2={g.pos} stroke="#7ba5ff" strokeWidth={.8} strokeDasharray="4 3" opacity={.7} />
            )}

            {/* Espacios */}
            {espacios.map(esp => {
              const isSel    = selIds.has(esp.id)
              const color    = TV_COLOR[esp.tipoVehiculo] || C.accent
              const cx       = esp.x + esp.w / 2
              const cy       = esp.y + esp.h / 2
              const ang      = esp.angulo || 0
              const fs       = Math.min(esp.w, esp.h) < 40 ? 7 : 10
              const icon     = TV_GLYPH[esp.tipoVehiculo] || 'P'

              // Handles de resize (en espacio local antes de rotar)
              const handles = [
                ['n',  cx,          esp.y,          'ns-resize'],
                ['s',  cx,          esp.y + esp.h,  'ns-resize'],
                ['w',  esp.x,       cy,             'ew-resize'],
                ['e',  esp.x+esp.w, cy,             'ew-resize'],
                ['nw', esp.x,       esp.y,          'nwse-resize'],
                ['ne', esp.x+esp.w, esp.y,          'nesw-resize'],
                ['sw', esp.x,       esp.y+esp.h,    'nesw-resize'],
                ['se', esp.x+esp.w, esp.y+esp.h,    'nwse-resize'],
              ]

              return (
                <g key={esp.id} transform={`rotate(${ang}, ${cx}, ${cy})`}>
                  {/* Sombra/glow al seleccionar */}
                  {isSel && (
                    <rect
                      x={esp.x - 3} y={esp.y - 3}
                      width={esp.w + 6} height={esp.h + 6}
                      rx={7} fill="none"
                      stroke={color} strokeWidth={1.5} opacity={.35}
                    />
                  )}

                  {/* Cuerpo del espacio */}
                  <rect
                    x={esp.x + 2} y={esp.y + 2}
                    width={esp.w - 4} height={esp.h - 4}
                    rx={5}
                    fill={color + (isSel ? '28' : '14')}
                    stroke={isSel ? '#fff' : color}
                    strokeWidth={isSel ? 2 : 1.5}
                    style={{ cursor: 'grab' }}
                    onMouseDown={ev => {
                      if (dragRef.current?.type) return
                      const snapshots = {}
                      espacios.forEach(e => { snapshots[e.id] = { x: e.x, y: e.y } })
                      const pt = getSVGCoord(ev)
                      const ids = ev.shiftKey
                        ? (selIds.has(esp.id) ? [...selIds] : [...selIds, esp.id])
                        : (selIds.has(esp.id) ? [...selIds] : [esp.id])
                      if (!ev.shiftKey && !selIds.has(esp.id)) setSelIds(new Set([esp.id]))
                      dragRef.current = { type: 'move', startX: pt.x, startY: pt.y, snapshots, ids }
                      ev.stopPropagation()
                    }}
                    onClick={ev => {
                      ev.stopPropagation()
                      if (ev.shiftKey) {
                        setSelIds(prev => { const n = new Set(prev); n.has(esp.id) ? n.delete(esp.id) : n.add(esp.id); return n })
                      } else {
                        setSelIds(new Set([esp.id]))
                      }
                    }}
                  />

                  {/* Línea indicadora de orientación (frente del espacio) */}
                  <line
                    x1={esp.x + esp.w * .2} y1={esp.y + 5}
                    x2={esp.x + esp.w * .8} y2={esp.y + 5}
                    stroke={color} strokeWidth={2} strokeLinecap="round" opacity={.6}
                    pointerEvents="none"
                  />

                  {/* Icono tipo */}
                  <text
                    x={cx} y={cy - fs * .5}
                    textAnchor="middle" fontSize={Math.min(esp.w, esp.h) < 40 ? 10 : 16}
                    pointerEvents="none"
                  >{icon}</text>

                  {/* Código */}
                  <text
                    x={cx} y={cy + fs + 4}
                    textAnchor="middle" fontSize={fs} fontWeight={700}
                    fill={color} fontFamily={FF} pointerEvents="none"
                  >{esp.codigo}</text>

                  {/* Handles resize (solo cuando seleccionado) */}
                  {isSel && handles.map(([h, hx, hy, cur]) => (
                    <rect
                      key={h}
                      x={hx - HANDLE_R} y={hy - HANDLE_R}
                      width={HANDLE_R * 2} height={HANDLE_R * 2} rx={2}
                      fill={C.surface} stroke={color} strokeWidth={1.5}
                      style={{ cursor: cur }}
                      onMouseDown={ev => { ev.stopPropagation(); startResize(ev, esp, h) }}
                    />
                  ))}

                  {/* Handle de rotación (solo cuando seleccionado) */}
                  {isSel && (
                    <g>
                      <line
                        x1={cx} y1={esp.y - 8}
                        x2={cx} y2={esp.y - ROT_HANDLE_OFFSET}
                        stroke={color} strokeWidth={1} opacity={.6}
                        pointerEvents="none"
                      />
                      <circle
                        cx={cx} cy={esp.y - ROT_HANDLE_OFFSET}
                        r={HANDLE_R + 1}
                        fill={C.surface} stroke={color} strokeWidth={1.5}
                        style={{ cursor: 'crosshair' }}
                        onMouseDown={ev => { ev.stopPropagation(); startRotate(ev, esp) }}
                      />
                      {/* Flecha de rotación */}
                      <text
                        x={cx} y={esp.y - ROT_HANDLE_OFFSET + 4}
                        textAnchor="middle" fontSize={8}
                        fill={color} fontFamily={FF} pointerEvents="none"
                      >↺</text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* Recuadro de selección */}
            {selBox && (
              <rect
                x={Math.min(selBox.x0, selBox.x1)} y={Math.min(selBox.y0, selBox.y1)}
                width={Math.abs(selBox.x1 - selBox.x0)} height={Math.abs(selBox.y1 - selBox.y0)}
                fill={C.accent + '14'} stroke={C.accent}
                strokeWidth={1} strokeDasharray="4 3"
                pointerEvents="none"
              />
            )}
          </svg>
        </div>

        {/* ── Panel Derecho: Propiedades ── */}
        <div style={{
          width: 280, background: 'linear-gradient(180deg, rgba(11,13,17,.95), rgba(11,13,17,.82))', borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
        }}>
          {selOne ? (
            <>
              <Section title="PROPIEDADES" icon={<Settings2 size={12} />}>
                {/* Código */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5, display: 'block', marginBottom: 3 }}>CÓDIGO</label>
                  <input
                    value={selOne.codigo}
                    onChange={e => updateProp(selOne.id, 'codigo', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: FF, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Tipo */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5, display: 'block', marginBottom: 3 }}>TIPO VEHÍCULO</label>
                  <select
                    value={selOne.tipoVehiculo}
                    onChange={e => updateProp(selOne.id, 'tipoVehiculo', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: FF, outline: 'none' }}
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Posición */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <NumInput label="X" value={Math.round(selOne.x)} onChange={v => updateProp(selOne.id, 'x', v)} />
                  <NumInput label="Y" value={Math.round(selOne.y)} onChange={v => updateProp(selOne.id, 'y', v)} />
                </div>

                {/* Tamaño */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <NumInput label="W" value={Math.round(selOne.w)} min={20} onChange={v => updateProp(selOne.id, 'w', v)} />
                  <NumInput label="H" value={Math.round(selOne.h)} min={20} onChange={v => updateProp(selOne.id, 'h', v)} />
                </div>

                {/* Ángulo */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                    ÁNGULO — {Math.round(selOne.angulo || 0)}°
                  </label>
                  <input
                    type="range" min={0} max={359} step={1}
                    value={selOne.angulo || 0}
                    onChange={e => updateProp(selOne.id, 'angulo', Number(e.target.value))}
                    style={{ width: '100%', accentColor: TV_COLOR[selOne.tipoVehiculo] || C.accent }}
                  />
                  {/* Presets ángulo */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {[0, 45, 90, 135, 180, 270].map(a => (
                      <button
                        key={a}
                        onClick={() => updateProp(selOne.id, 'angulo', a)}
                        style={{
                          padding: '3px 8px', borderRadius: 6,
                          background: Math.round(selOne.angulo || 0) === a ? TV_COLOR[selOne.tipoVehiculo] + '30' : C.s2,
                          border: `1px solid ${Math.round(selOne.angulo || 0) === a ? TV_COLOR[selOne.tipoVehiculo] : C.border}`,
                          color: Math.round(selOne.angulo || 0) === a ? TV_COLOR[selOne.tipoVehiculo] : C.muted,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
                        }}
                      >{a}°</button>
                    ))}
                  </div>
                </div>

                {/* Color indicator */}
                <div style={{ padding: '8px 10px', background: (TV_COLOR[selOne.tipoVehiculo] || C.accent) + '14', border: `1px solid ${(TV_COLOR[selOne.tipoVehiculo] || C.accent)}30`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: TV_COLOR[selOne.tipoVehiculo] || C.accent }} />
                  <span style={{ fontSize: 12, color: TV_COLOR[selOne.tipoVehiculo] || C.accent, fontWeight: 700, fontFamily: FF, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const Icon = TV_ICON[selOne.tipoVehiculo] || ParkingSquare
                      return <Icon size={13} />
                    })()}
                    {selOne.tipoVehiculo}
                  </span>
                </div>

                {/* Acciones rápidas */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button onClick={duplicarSel} style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: C.s2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Copy size={12} /> Duplicar
                  </button>
                  <button onClick={eliminarSel} style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: C.danger + '14', border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </Section>
            </>
          ) : selArr.length > 1 ? (
            <Section title="SELECCIÓN" icon={<Layers size={12} />}>
              <div style={{ padding: '10px', background: C.s2, borderRadius: 8, marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: C.text, fontWeight: 700, fontFamily: FF, margin: 0 }}>{selArr.length} espacios</p>
                <p style={{ fontSize: 11, color: C.muted, fontFamily: FF, margin: '4px 0 0' }}>Usa los botones de alineación en la barra superior</p>
              </div>
              <button onClick={eliminarSel} style={{ padding: '8px', borderRadius: 8, background: C.danger + '14', border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={13} /> Eliminar selección
              </button>
            </Section>
          ) : (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <MousePointer2 size={28} color={C.border} />
              <p style={{ color: C.muted, fontSize: 12, fontFamily: FF, textAlign: 'center', lineHeight: 1.6 }}>
                Haz clic en un espacio para ver y editar sus propiedades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sección colapsable del panel lateral ───────────────────────────────────
function Section({ title, icon, children, collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <button
        onClick={() => collapsible && setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
          color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1,
          cursor: collapsible ? 'pointer' : 'default', fontFamily: FF,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon} {title}</span>
        {collapsible && (open ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  )
}


