/**
 * ParkingMap.jsx
 *
 * mode='editor' : zoom/pan (Ctrl+rueda, Espacio+drag, click-rueda),
 *                 herramientas de dibujo, guardar.
 * mode='reserva': vista estática, clic en espacio disponible.
 *
 * Props:
 *  mode            : 'editor' | 'reserva'
 *  plano           : { elementos:[{type,x,y,w,h}], ancho, alto }
 *  espacios        : [{id,codigo,x,y,w,h,tipoVehiculo,estado}]
 *  franjas         : [{id,label,time}]   — solo reserva
 *  onSave          : (plano, espacios)=>void  — solo editor
 *  onSelectEspacio : (data)=>void             — solo reserva
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ZoomIn, ZoomOut, Maximize2, Trash2,
  MousePointer2, Square, Minus, ParkingSquare,
} from 'lucide-react'
import { C, GRAD } from '../tokens'

// ── Constantes ─────────────────────────────────────────────────────────────
const GRID = 20
const FF   = "'Plus Jakarta Sans', sans-serif"

const W_PARED = '#2e3054'
const W_PAS   = '#17192e'

const TIPOS_VEHICULO = ['AUTO', 'MOTO', 'BICICLETA', 'DISCAPACIDAD']
const TV_COLOR = {
  AUTO:         '#5b7eff',
  MOTO:         '#a259ff',
  BICICLETA:    '#3de8c8',
  DISCAPACIDAD: '#ffaa00',
}
const TV_ICON = { AUTO: '🚗', MOTO: '🏍', BICICLETA: '🚲', DISCAPACIDAD: '♿' }
const ESTADO_COLOR = {
  DISPONIBLE:    '#3de8c8',
  OCUPADO:       '#ff4d6d',
  BLOQUEADO:     '#6b7099',
  MANTENIMIENTO: '#ffaa00',
}

const snap  = v  => Math.round(v / GRID) * GRID
const uid   = () => Math.random().toString(36).slice(2, 8)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ══════════════════════════════════════════════════════════════════════════
//  Sub-componentes
// ══════════════════════════════════════════════════════════════════════════

// ── Botón de herramienta ───────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, danger = false, disabled = false, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 11px', borderRadius: 9, width: '100%',
        background: active  ? GRAD
                  : danger  ? '#ff4d6d14'
                  : C.s2,
        color:   active  ? '#fff'
               : danger  ? '#ff4d6d'
               : disabled ? C.border
               : C.muted,
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
        fontFamily: FF, transition: 'background .15s, color .15s',
        border: `1.5px solid ${active ? 'transparent' : danger ? '#ff4d6d30' : C.border}`,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ── Paleta lateral (solo editor) ───────────────────────────────────────────
function Palette({ tool, setTool, seleccionado, onDelete, zoom, setZoom, setPan, ANCHO, ALTO, containerRef }) {

  // Fit-to-screen: centrar el mapa con padding
  const fitView = useCallback(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const pad  = 32
    const zx   = (width  - pad * 2) / ANCHO
    const zy   = (height - pad * 2) / ALTO
    const nz   = clamp(Math.min(zx, zy), 0.2, 4)
    setZoom(nz)
    setPan({
      x: (width  - ANCHO * nz) / 2,
      y: (height - ALTO  * nz) / 2,
    })
  }, [ANCHO, ALTO, containerRef, setZoom, setPan])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '14px 10px', background: C.surface,
      borderRight: `1px solid ${C.border}`, width: 152, flexShrink: 0,
      overflowY: 'auto',
    }}>

      {/* ── Herramientas ── */}
      <p style={labelStyle}>HERRAMIENTAS</p>

      <ToolBtn active={tool === 'select'}  onClick={() => setTool('select')}
        title="Seleccionar / mover  (V)">
        <MousePointer2 size={14} /> Seleccionar
      </ToolBtn>
      <ToolBtn active={tool === 'pared'}   onClick={() => setTool('pared')}
        title="Dibujar pared">
        <Minus size={14} /> Pared
      </ToolBtn>
      <ToolBtn active={tool === 'pasillo'} onClick={() => setTool('pasillo')}
        title="Dibujar pasillo">
        <Square size={14} /> Pasillo
      </ToolBtn>
      <ToolBtn active={tool === 'espacio'} onClick={() => setTool('espacio')}
        title="Colocar espacio  (P)">
        <ParkingSquare size={14} /> Espacio
      </ToolBtn>

      <Sep />

      {/* ── Vista / Zoom ── */}
      <p style={labelStyle}>VISTA</p>

      <div style={{ display: 'flex', gap: 5 }}>
        <IconBtn title="Alejar  (Ctrl+−)" onClick={() => setZoom(z => clamp(z / 1.3, 0.2, 4))}>
          <ZoomOut size={13} />
        </IconBtn>
        <button
          title="Restablecer zoom (100%)"
          onClick={() => { setZoom(1); setPan({ x: 20, y: 20 }) }}
          style={{
            flex: 1, background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 7, height: 30, fontSize: 11, fontWeight: 700,
            color: C.muted, cursor: 'pointer', fontFamily: FF,
          }}
        >{Math.round(zoom * 100)}%</button>
        <IconBtn title="Acercar  (Ctrl++)" onClick={() => setZoom(z => clamp(z * 1.3, 0.2, 4))}>
          <ZoomIn size={13} />
        </IconBtn>
      </div>

      <ToolBtn onClick={fitView} title="Ajustar mapa a la pantalla">
        <Maximize2 size={14} /> Ajustar vista
      </ToolBtn>

      <Sep />

      {/* ── Leyenda ── */}
      <p style={labelStyle}>LEYENDA</p>
      {Object.entries(TV_COLOR).map(([tipo, color]) => (
        <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 4px' }}>
          <div style={{
            width: 10, height: 10, borderRadius: 3, flexShrink: 0,
            background: color + '28', border: `1.5px solid ${color}`,
          }} />
          <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
            {TV_ICON[tipo]} {tipo}
          </span>
        </div>
      ))}

      {/* ── Eliminar (contextual) ── */}
      {seleccionado && (
        <>
          <Sep />
          <ToolBtn danger onClick={onDelete} title="Eliminar seleccionado  (Supr)">
            <Trash2 size={14} /> Eliminar
          </ToolBtn>
        </>
      )}

      {/* ── Atajos de teclado ── */}
      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
        <div style={{
          background: '#0a0b1a', border: `1px solid ${C.border}`,
          borderRadius: 9, padding: '9px 10px',
        }}>
          {[
            ['Ctrl+rueda', 'Zoom'],
            ['Esp+arrastrar', 'Mover vista'],
            ['Supr / ⌫', 'Eliminar'],
            ['Esc', 'Deseleccionar'],
            ['V', 'Seleccionar'],
            ['P', 'Espacio'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: C.muted, fontFamily: FF }}>{v}</span>
              <code style={{ fontSize: 9, color: C.accent, background: C.s2, borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{k}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Helpers de estilo ──────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: FF,
  letterSpacing: 1, paddingLeft: 2, margin: '2px 0',
}

function Sep() {
  return <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
}

function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: C.s2, border: `1px solid ${C.border}`,
        borderRadius: 7, width: 30, height: 30, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: C.muted,
      }}
    >{children}</button>
  )
}

// ── Modal nuevo espacio ────────────────────────────────────────────────────
function ModalEspacio({ rect, onConfirm, onCancel }) {
  const [codigo, setCodigo] = useState('')
  const [tipo,   setTipo]   = useState('AUTO')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000085',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 18, padding: 28, minWidth: 310,
        boxShadow: '0 24px 64px #00000070',
      }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 20 }}>
          Nuevo espacio
        </p>

        <label style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontWeight: 600 }}>CÓDIGO</label>
        <input
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          placeholder="ej. A-01"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && codigo) onConfirm({ codigo, tipoVehiculo: tipo }) }}
          style={{
            width: '100%', marginTop: 6, marginBottom: 18,
            padding: '10px 14px', borderRadius: 10,
            background: C.s2, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, fontFamily: FF, boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        <label style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontWeight: 600 }}>TIPO DE VEHÍCULO</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, marginBottom: 22 }}>
          {TIPOS_VEHICULO.map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{
                padding: '9px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: FF,
                background: tipo === t ? TV_COLOR[t] + '22' : C.s2,
                border: `1.5px solid ${tipo === t ? TV_COLOR[t] : C.border}`,
                color: tipo === t ? TV_COLOR[t] : C.muted,
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {TV_ICON[t]} {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, background: C.s2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF }}>
            Cancelar
          </button>
          <button
            onClick={() => { if (codigo) onConfirm({ codigo, tipoVehiculo: tipo }) }}
            disabled={!codigo}
            style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: codigo ? GRAD : C.border,
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: codigo ? 'pointer' : 'not-allowed', fontFamily: FF,
            }}
          >Agregar espacio</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal reserva ──────────────────────────────────────────────────────────
function ModalReserva({ espacio, franjas, onConfirm, onCancel }) {
  const [franja, setFranja] = useState(franjas[0]?.id || null)
  const [fecha,  setFecha]  = useState(new Date().toISOString().slice(0, 10))

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000085', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, minWidth: 310, boxShadow: '0 24px 64px #00000070' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FF, marginBottom: 4 }}>
          Reservar espacio
        </p>
        <p style={{ fontSize: 13, color: C.muted, fontFamily: FF, marginBottom: 20 }}>
          {espacio.codigo} · {espacio.tipoVehiculo}
        </p>

        <label style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontWeight: 600 }}>FECHA</label>
        <input
          type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{ width: '100%', marginTop: 6, marginBottom: 16, padding: '9px 12px', borderRadius: 9, background: C.s2, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: FF, boxSizing: 'border-box' }}
        />

        <label style={{ fontSize: 11, color: C.muted, fontFamily: FF, fontWeight: 600, display: 'block', marginBottom: 8 }}>FRANJA HORARIA</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {franjas.map(f => (
            <button
              key={f.id}
              onClick={() => setFranja(f.id)}
              style={{
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: franja === f.id ? GRAD : C.s2,
                border: `1px solid ${franja === f.id ? 'transparent' : C.border}`,
                color: franja === f.id ? '#fff' : C.text,
                fontSize: 13, fontWeight: 600, fontFamily: FF, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>{f.label}</span>
              <span style={{ opacity: 0.7 }}>{f.time}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px', borderRadius: 9, background: C.s2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF }}>Cancelar</button>
          <button
            onClick={() => onConfirm({ espacioId: espacio.id, franjaId: franja, fecha })}
            style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: GRAD, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}
          >Confirmar reserva</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function ParkingMap({
  mode            = 'reserva',
  plano:  planoInicial,
  espacios: espaciosIniciales = [],
  franjas         = [],
  onSave,
  onSelectEspacio,
}) {
  const ANCHO = planoInicial?.ancho || 800
  const ALTO  = planoInicial?.alto  || 500

  // ── Estado editor ──────────────────────────────────────────────────────
  const [tool,         setTool]         = useState('select')
  const [elementos,    setElementos]    = useState(planoInicial?.elementos || [])
  const [espacios,     setEspacios]     = useState(espaciosIniciales)
  const [selId,        setSelId]        = useState(null)
  const [drawing,      setDrawing]      = useState(null)
  const [modal,        setModal]        = useState(null)
  const [modalReserva, setModalReserva] = useState(null)

  // ── Zoom / Pan (solo editor) ───────────────────────────────────────────
  const [zoom,      setZoom]      = useState(1)
  const [pan,       setPan]       = useState({ x: 20, y: 20 })
  const [isPanning, setIsPanning] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)

  const svgRef       = useRef()
  const containerRef = useRef()
  const dragRef      = useRef(null)
  const panRef       = useRef(null)

  // ── Keyboard shortcuts (editor) ────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'editor') return
    const onDown = (e) => {
      if (e.target.matches('input,textarea,select')) return
      if (e.code === 'Space') { e.preventDefault(); setSpaceDown(true) }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setElementos(p => p.filter(el => el.id !== selId))
        setEspacios(p  => p.filter(el => el.id !== selId))
        setSelId(null)
      }
      if (e.key === 'Escape') setSelId(null)
      if (e.key === 'v' || e.key === 'V') setTool('select')
      if (e.key === 'p' || e.key === 'P') setTool('espacio')
    }
    const onUp = (e) => { if (e.code === 'Space') setSpaceDown(false) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [mode, selId])

  // ── Rueda → zoom (Ctrl) o pan (libre) ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el || mode !== 'editor') return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Zoom centrado en el cursor
        const rect = el.getBoundingClientRect()
        const mx   = e.clientX - rect.left
        const my   = e.clientY - rect.top
        const factor = e.deltaY < 0 ? 1.12 : 0.89
        setZoom(z => {
          const nz = clamp(z * factor, 0.15, 5)
          setPan(p => ({
            x: mx - (mx - p.x) * (nz / z),
            y: my - (my - p.y) * (nz / z),
          }))
          return nz
        })
      } else {
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [mode])

  // ── getSVGPoint: coordenadas dentro del SVG independientes del zoom ─────
  const getSVGPoint = useCallback((e) => {
    const svg  = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const sx   = ANCHO / rect.width
    const sy   = ALTO  / rect.height
    return {
      x: snap((e.clientX - rect.left) * sx),
      y: snap((e.clientY - rect.top)  * sy),
    }
  }, [ANCHO, ALTO])

  // ── Mouse Down en container ────────────────────────────────────────────
  const onContainerMouseDown = useCallback((e) => {
    // Pan: rueda del ratón o Espacio+clic izquierdo
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault()
      panRef.current = { sx: e.clientX - pan.x, sy: e.clientY - pan.y }
      setIsPanning(true)
      return
    }
    if (e.button !== 0 || mode !== 'editor') return

    // Solo procesar si el clic cae dentro del SVG
    const svgEl = svgRef.current
    if (!svgEl) return
    const sr = svgEl.getBoundingClientRect()
    const inSvg = e.clientX >= sr.left && e.clientX <= sr.right &&
                  e.clientY >= sr.top  && e.clientY <= sr.bottom

    if (!inSvg) { setSelId(null); return }

    const pt = getSVGPoint(e)

    if (tool === 'select') {
      const hit = [...elementos, ...espacios].find(el =>
        pt.x >= el.x && pt.x <= el.x + el.w &&
        pt.y >= el.y && pt.y <= el.y + el.h
      )
      setSelId(hit?.id ?? null)
      if (hit) dragRef.current = { id: hit.id, ox: pt.x - hit.x, oy: pt.y - hit.y }
      return
    }

    setDrawing({ x: pt.x, y: pt.y, w: 0, h: 0 })
    setSelId(null)
  }, [mode, tool, elementos, espacios, getSVGPoint, spaceDown, pan])

  // ── Window: move + up ─────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (isPanning && panRef.current) {
        setPan({ x: e.clientX - panRef.current.sx, y: e.clientY - panRef.current.sy })
        return
      }
      if (!svgRef.current) return
      const pt = getSVGPoint(e)

      if (dragRef.current) {
        const { id, ox, oy } = dragRef.current
        const mv = arr => arr.map(el => el.id === id ? { ...el, x: snap(pt.x - ox), y: snap(pt.y - oy) } : el)
        setElementos(mv)
        setEspacios(mv)
        return
      }
      if (drawing) {
        setDrawing(p => ({
          ...p,
          w: Math.max(GRID, snap(pt.x - p.x)),
          h: Math.max(GRID, snap(pt.y - p.y)),
        }))
      }
    }

    const onUp = () => {
      if (isPanning) { setIsPanning(false); panRef.current = null; return }
      dragRef.current = null

      if (!drawing || drawing.w < GRID || drawing.h < GRID) { setDrawing(null); return }

      const rect = { ...drawing, id: uid() }
      if (tool === 'pared' || tool === 'pasillo') {
        setElementos(p => [...p, { ...rect, type: tool }])
      } else if (tool === 'espacio') {
        setModal({ rect })
      }
      setDrawing(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning, drawing, tool, getSVGPoint])

  // ── Confirmar espacio ──────────────────────────────────────────────────
  const confirmarEspacio = ({ codigo, tipoVehiculo }) => {
    setEspacios(p => [...p, { ...modal.rect, codigo, tipoVehiculo, estado: 'DISPONIBLE' }])
    setModal(null)
  }

  // ── Eliminar seleccionado ──────────────────────────────────────────────
  const eliminarSeleccionado = () => {
    setElementos(p => p.filter(e => e.id !== selId))
    setEspacios(p  => p.filter(e => e.id !== selId))
    setSelId(null)
  }

  // ── Guardar ────────────────────────────────────────────────────────────
  const guardar = () => onSave?.({ elementos, ancho: ANCHO, alto: ALTO }, espacios)

  // ── Clic en espacio (reserva) ──────────────────────────────────────────
  const clicEspacio = esp => {
    if (mode !== 'reserva' || esp.estado !== 'DISPONIBLE') return
    if (franjas.length > 0) setModalReserva(esp)
    else onSelectEspacio?.(esp)
  }

  // ── Cursor ────────────────────────────────────────────────────────────
  const cursor = mode !== 'editor'  ? 'default'
               : isPanning          ? 'grabbing'
               : spaceDown          ? 'grab'
               : tool !== 'select'  ? 'crosshair'
               : 'default'

  // ══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: C.bg }}>

      {/* Paleta */}
      {mode === 'editor' && (
        <Palette
          tool={tool} setTool={setTool}
          seleccionado={!!selId} onDelete={eliminarSeleccionado}
          zoom={zoom} setZoom={setZoom} setPan={setPan}
          ANCHO={ANCHO} ALTO={ALTO} containerRef={containerRef}
        />
      )}

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        onMouseDown={onContainerMouseDown}
        style={{
          flex: 1, overflow: 'hidden', position: 'relative',
          background: mode === 'editor' ? '#090a18' : C.bg,
          cursor,
        }}
      >
        {/* Dot grid (editor) */}
        {mode === 'editor' && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            <defs>
              <pattern
                id="dotgrid-pm"
                x={((pan.x % (GRID * zoom)) + GRID * zoom) % (GRID * zoom)}
                y={((pan.y % (GRID * zoom)) + GRID * zoom) % (GRID * zoom)}
                width={GRID * zoom} height={GRID * zoom}
                patternUnits="userSpaceOnUse"
              >
                <circle cx={GRID * zoom / 2} cy={GRID * zoom / 2} r={0.8} fill="#3a3c5c" opacity={0.7} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid-pm)" />
          </svg>
        )}

        {/* SVG principal */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          style={mode === 'editor' ? {
            position: 'absolute',
            left: pan.x, top: pan.y,
            width: ANCHO * zoom, height: ALTO * zoom,
            display: 'block', zIndex: 1,
            borderRadius: 10,
            boxShadow: '0 0 0 1px rgba(255,255,255,.07), 0 28px 72px rgba(0,0,0,.55)',
            userSelect: 'none',
          } : {
            width: '100%', maxWidth: ANCHO,
            display: 'block', userSelect: 'none',
          }}
        >
          {/* Fondo canvas */}
          <rect x={0} y={0} width={ANCHO} height={ALTO} fill={C.bg} />

          {/* Grid de líneas (editor, muy sutil) */}
          {mode === 'editor' && (
            <g opacity={0.04}>
              {Array.from({ length: Math.ceil(ANCHO / GRID) }).map((_, i) => (
                <line key={'v'+i} x1={i*GRID} y1={0} x2={i*GRID} y2={ALTO} stroke={C.muted} strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.ceil(ALTO / GRID) }).map((_, i) => (
                <line key={'h'+i} x1={0} y1={i*GRID} x2={ANCHO} y2={i*GRID} stroke={C.muted} strokeWidth={0.5} />
              ))}
            </g>
          )}

          {/* Elementos decorativos (paredes/pasillos) */}
          {elementos.map(el => {
            const sel = selId === el.id
            return (
              <g key={el.id} style={{ cursor: mode === 'editor' && tool === 'select' ? 'pointer' : undefined }}>
                {/* Glow al seleccionar */}
                {sel && (
                  <rect
                    x={el.x - 4} y={el.y - 4} width={el.w + 8} height={el.h + 8}
                    fill="none" stroke="#5b7eff" strokeWidth={1}
                    rx={6} opacity={0.35} strokeDasharray="5 3"
                  />
                )}
                <rect
                  x={el.x} y={el.y} width={el.w} height={el.h}
                  fill={el.type === 'pared' ? W_PARED : W_PAS}
                  stroke={sel ? '#5b7eff' : (el.type === 'pared' ? '#4a4c6c' : '#2a2c4c')}
                  strokeWidth={sel ? 2 : 1} rx={el.type === 'pasillo' ? 4 : 2}
                />
                {mode === 'editor' && (
                  <text
                    x={el.x + el.w / 2} y={el.y + el.h / 2 + 4}
                    textAnchor="middle" fontSize={9}
                    fill={C.muted} fontFamily={FF} fontWeight={600} pointerEvents="none"
                  >{el.type === 'pared' ? 'PARED' : 'PASILLO'}</text>
                )}
              </g>
            )
          })}

          {/* Rectángulo en construcción */}
          {drawing && (
            <rect
              x={drawing.x} y={drawing.y}
              width={drawing.w || 1} height={drawing.h || 1}
              fill={tool === 'espacio' ? '#5b7eff18' : tool === 'pared' ? '#3a3c5c80' : '#1a1c3580'}
              stroke={tool === 'espacio' ? '#5b7eff' : C.muted}
              strokeWidth={1.5} strokeDasharray="5 3" rx={2}
            />
          )}

          {/* Espacios de parqueo */}
          {espacios.map(esp => {
            const disp  = esp.estado === 'DISPONIBLE'
            const color = mode === 'reserva'
              ? (disp ? ESTADO_COLOR.DISPONIBLE : ESTADO_COLOR[esp.estado] || C.muted)
              : TV_COLOR[esp.tipoVehiculo] || C.accent
            const isSel  = selId === esp.id
            const fsize  = Math.min(esp.w, esp.h) < 40 ? 8 : 10
            const small  = Math.min(esp.w, esp.h) < 40

            return (
              <g
                key={esp.id}
                onClick={() => { if (mode === 'editor') { setSelId(esp.id); return } clicEspacio(esp) }}
                style={{ cursor: mode === 'reserva' && disp ? 'pointer' : mode === 'editor' ? 'pointer' : 'not-allowed' }}
              >
                {/* Glow selección */}
                {isSel && (
                  <rect
                    x={esp.x - 4} y={esp.y - 4} width={esp.w + 8} height={esp.h + 8}
                    fill="none" stroke={color} strokeWidth={1}
                    rx={8} opacity={0.4} strokeDasharray="5 3"
                  />
                )}
                {/* Cuerpo del espacio */}
                <rect
                  x={esp.x + 2} y={esp.y + 2}
                  width={esp.w - 4} height={esp.h - 4}
                  fill={color + (isSel ? '28' : '16')}
                  stroke={isSel ? '#fff' : color}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  rx={5}
                />
                {/* Indicador estado (reserva) */}
                {mode === 'reserva' && (
                  <circle
                    cx={esp.x + esp.w - 8} cy={esp.y + 8} r={4}
                    fill={disp ? ESTADO_COLOR.DISPONIBLE : ESTADO_COLOR[esp.estado] || C.muted}
                  />
                )}
                {/* Código */}
                <text
                  x={esp.x + esp.w / 2}
                  y={esp.y + esp.h / 2 - (mode === 'reserva' && !small ? 3 : 2)}
                  textAnchor="middle" fontSize={fsize}
                  fontWeight={700} fill={color} fontFamily={FF} pointerEvents="none"
                >{esp.codigo}</text>
                {/* Tipo (reserva) */}
                {mode === 'reserva' && !small && (
                  <text
                    x={esp.x + esp.w / 2} y={esp.y + esp.h / 2 + fsize + 1}
                    textAnchor="middle" fontSize={fsize - 1}
                    fill={color} opacity={0.55} fontFamily={FF} pointerEvents="none"
                  >{esp.tipoVehiculo?.slice(0, 4)}</text>
                )}
                {/* Tipo (editor, si hay espacio) */}
                {mode === 'editor' && !small && (
                  <text
                    x={esp.x + esp.w / 2} y={esp.y + esp.h / 2 + fsize + 2}
                    textAnchor="middle" fontSize={8}
                    fill={color} opacity={0.45} fontFamily={FF} pointerEvents="none"
                  >{esp.tipoVehiculo?.slice(0, 3)}</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* ── Controles flotantes (editor) ── */}
        {mode === 'editor' && (
          <>
            {/* Guardar */}
            <button
              onClick={guardar}
              style={{
                position: 'absolute', bottom: 20, right: 20, zIndex: 10,
                padding: '11px 22px', borderRadius: 12, border: 'none',
                background: GRAD, color: '#fff', fontSize: 14,
                fontWeight: 700, cursor: 'pointer', fontFamily: FF,
                boxShadow: '0 4px 24px #5b7eff50',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              💾 Guardar mapa
            </button>

            {/* Info zoom + conteo */}
            <div style={{
              position: 'absolute', bottom: 20, left: 10, zIndex: 10,
              background: C.surface + 'dd', backdropFilter: 'blur(8px)',
              border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '5px 12px', display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
                {Math.round(zoom * 100)}%
              </span>
              <div style={{ width: 1, height: 12, background: C.border }} />
              <span style={{ fontSize: 11, color: C.accent, fontFamily: FF, fontWeight: 700 }}>
                {espacios.length} espacios
              </span>
              {elementos.length > 0 && (
                <>
                  <div style={{ width: 1, height: 12, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: FF }}>
                    {elementos.length} elementos
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      {modal && (
        <ModalEspacio
          rect={modal.rect}
          onConfirm={confirmarEspacio}
          onCancel={() => setModal(null)}
        />
      )}
      {modalReserva && (
        <ModalReserva
          espacio={modalReserva}
          franjas={franjas}
          onConfirm={data => { onSelectEspacio?.(data); setModalReserva(null) }}
          onCancel={() => setModalReserva(null)}
        />
      )}
    </div>
  )
}