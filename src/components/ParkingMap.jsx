import { useEffect, useMemo, useRef, useState } from 'react'
import { C, GRAD } from '../tokens'

const FF = "'Plus Jakarta Sans', sans-serif"
const GRID_RENDER = 8
const GRID_DRAW_SNAP = 8
const GRID_MOVE_SNAP = 2
const MIN_CELL_SIZE = 20
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1

const VEHICLE_TYPES = ['AUTO', 'MOTO', 'DISCAPACITADO', 'ELECTRICO']

const VEHICLE_COLORS = {
  AUTO: '#5b7eff',
  MOTO: '#a259ff',
  DISCAPACITADO: '#ffaa00',
  ELECTRICO: '#3de8c8',
}

const STATE_COLORS = {
  DISPONIBLE: '#3de8c8',
  RESERVADO: '#a259ff',
  OCUPADO: '#ffaa00',
  BLOQUEADO: '#ff4d6d',
  MANTENIMIENTO: '#ff4d6d',
}

const uid = () => Math.random().toString(36).slice(2, 10)
const snap = (n, step = GRID_MOVE_SNAP) => Math.round(n / step) * step
const degToRad = (deg) => (deg * Math.PI) / 180

function normalizeType(type) {
  if (!type) return 'wall'
  if (type === 'pared') return 'wall'
  if (type === 'pasillo') return 'road'
  return type
}

function normalizeElement(el) {
  return {
    id: el.id ?? uid(),
    type: normalizeType(el.type),
    x: Number(el.x ?? 0),
    y: Number(el.y ?? 0),
    w: Number(el.w ?? 80),
    h: Number(el.h ?? 80),
  }
}

function normalizeSpace(space) {
  const c = space.coordenadas || {}
  const rawX = space.x ?? c.x
  const rawY = space.y ?? c.y
  const rawW = space.w ?? c.w
  const rawH = space.h ?? c.h

  // Espacios sin coordenadas en BD no deben volver a mostrarse en el editor.
  if ([rawX, rawY, rawW, rawH].some((v) => v == null)) return null

  return {
    id: space.id ?? uid(),
    codigo: space.codigo || '',
    tipoVehiculo: space.tipoVehiculo || 'AUTO',
    estado: space.estado || 'DISPONIBLE',
    x: Number(rawX),
    y: Number(rawY),
    w: Number(rawW),
    h: Number(rawH),
    angulo: Number(space.angulo ?? c.angulo ?? 0),
  }
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 10px',
        borderRadius: 8,
        border: `1px solid ${active ? 'transparent' : C.border}`,
        background: active ? GRAD : C.s2,
        color: active ? '#fff' : C.muted,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: FF,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function SpaceModal({ onCancel, onConfirm }) {
  const [codigo, setCodigo] = useState('')
  const [tipoVehiculo, setTipoVehiculo] = useState('AUTO')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000088',
        display: 'grid',
        placeItems: 'center',
        zIndex: 300,
      }}
    >
      <div
        style={{
          width: 320,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
          fontFamily: FF,
        }}
      >
        <h3 style={{ margin: '0 0 14px', color: C.text, fontSize: 18 }}>Nuevo espacio</h3>

        <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6 }}>Codigo</label>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="A-01"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '9px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.s2,
            color: C.text,
            marginBottom: 12,
            fontFamily: FF,
          }}
        />

        <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6 }}>Tipo vehiculo</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {VEHICLE_TYPES.map((t) => {
            const active = tipoVehiculo === t
            return (
              <button
                key={t}
                onClick={() => setTipoVehiculo(t)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: `1px solid ${active ? VEHICLE_COLORS[t] : C.border}`,
                  background: active ? `${VEHICLE_COLORS[t]}22` : C.s2,
                  color: active ? VEHICLE_COLORS[t] : C.muted,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.s2,
              color: C.muted,
              cursor: 'pointer',
              fontFamily: FF,
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!codigo.trim()}
            onClick={() => onConfirm({ codigo: codigo.trim(), tipoVehiculo })}
            style={{
              flex: 1.2,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: codigo.trim() ? GRAD : C.border,
              color: '#fff',
              cursor: codigo.trim() ? 'pointer' : 'default',
              fontFamily: FF,
              fontWeight: 700,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

function pointInsideRotatedRect(pointX, pointY, space) {
  const cx = space.x + space.w / 2
  const cy = space.y + space.h / 2
  const rad = degToRad(-(space.angulo || 0))
  const dx = pointX - cx
  const dy = pointY - cy
  const localX = dx * Math.cos(rad) - dy * Math.sin(rad)
  const localY = dx * Math.sin(rad) + dy * Math.cos(rad)
  return Math.abs(localX) <= space.w / 2 && Math.abs(localY) <= space.h / 2
}

function clampPositive(value, min = MIN_CELL_SIZE) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.max(min, n)
}

function clampZoom(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, n))
}

function parseLocaleNumber(raw) {
  const text = String(raw ?? '').trim().replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export default function ParkingMap({
  mode = 'editor',
  plano,
  espacios,
  planoImagen,
  onSave,
  onSelectEspacio,
}) {
  const canvasW = plano?.ancho || 1200
  const canvasH = plano?.alto || 700
  const viewportRef = useRef(null)
  const svgRef = useRef(null)

  const [tool, setTool] = useState('select')
  const [elements, setElements] = useState([])
  const [spaces, setSpaces] = useState([])
  const [zoom, setZoom] = useState(1)
  const [navMode, setNavMode] = useState('cursor')
  const [isPanning, setIsPanning] = useState(false)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const [pendingSpaceRect, setPendingSpaceRect] = useState(null)
  const dragRef = useRef(null)
  const zoomRef = useRef(1)

  useEffect(() => {
    setElements((plano?.elementos || []).map(normalizeElement))
  }, [plano])

  useEffect(() => {
    setSpaces((espacios || []).map(normalizeSpace).filter(Boolean))
  }, [espacios])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    if (navMode !== 'hand' && dragRef.current?.type === 'pan') {
      dragRef.current = null
      setIsPanning(false)
    }
  }, [navMode])

  const selectedSpace = useMemo(() => {
    if (selected?.kind !== 'space') return null
    return spaces.find((s) => s.id === selected.id) || null
  }, [selected, spaces])

  const toPoint = (evt, snapStep = null) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const bounds = svg.getBoundingClientRect()
    const scaleX = canvasW / bounds.width
    const scaleY = canvasH / bounds.height
    const rawX = (evt.clientX - bounds.left) * scaleX
    const rawY = (evt.clientY - bounds.top) * scaleY
    return {
      x: snapStep == null ? rawX : snap(rawX, snapStep),
      y: snapStep == null ? rawY : snap(rawY, snapStep),
    }
  }

  const applyZoom = (nextZoom, anchorClient = null) => {
    const viewport = viewportRef.current
    const prevZoom = zoomRef.current
    const targetZoom = clampZoom(nextZoom)
    if (Math.abs(targetZoom - prevZoom) < 0.001) return

    if (!viewport) {
      setZoom(targetZoom)
      return
    }

    const rect = viewport.getBoundingClientRect()
    const anchorX = anchorClient?.x ?? rect.left + rect.width / 2
    const anchorY = anchorClient?.y ?? rect.top + rect.height / 2
    const worldX = (viewport.scrollLeft + (anchorX - rect.left)) / prevZoom
    const worldY = (viewport.scrollTop + (anchorY - rect.top)) / prevZoom

    setZoom(targetZoom)

    requestAnimationFrame(() => {
      viewport.scrollLeft = worldX * targetZoom - (anchorX - rect.left)
      viewport.scrollTop = worldY * targetZoom - (anchorY - rect.top)
    })
  }

  const onViewportWheel = (evt) => {
    if (mode !== 'editor') return
    if (!evt.ctrlKey) return
    evt.preventDefault()
    const delta = evt.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    applyZoom(zoomRef.current + delta, { x: evt.clientX, y: evt.clientY })
  }

  const startPan = (evt) => {
    const viewport = viewportRef.current
    if (!viewport) return
    evt.preventDefault()
    evt.stopPropagation()
    dragRef.current = {
      type: 'pan',
      startX: evt.clientX,
      startY: evt.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    }
    setIsPanning(true)
  }

  const hitTest = (x, y) => {
    const reversedSpaces = [...spaces].reverse()
    for (const sp of reversedSpaces) {
      if (pointInsideRotatedRect(x, y, sp)) return { ...sp, kind: 'space' }
    }

    const reversedElements = [...elements].reverse()
    for (const el of reversedElements) {
      const inside = x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h
      if (inside) return { ...el, kind: 'element' }
    }
    return null
  }

  const onMouseDown = (evt) => {
    if (mode !== 'editor') return
    if (navMode === 'hand' || evt.button === 1) {
      startPan(evt)
      return
    }
    const p = toPoint(evt, tool === 'select' ? null : GRID_DRAW_SNAP)

    if (tool === 'select') {
      const hit = hitTest(p.x, p.y)
      setSelected(hit ? { id: hit.id, kind: hit.kind } : null)

      if (hit?.kind === 'element') {
        dragRef.current = { type: 'move-element', id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y }
      } else if (hit?.kind === 'space') {
        dragRef.current = { type: 'move-space', id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y }
      }
      return
    }

    setSelected(null)
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onMouseMove = (evt) => {
    if (mode !== 'editor') return

    if (dragRef.current) {
      const op = dragRef.current

      if (op.type === 'pan') {
        const viewport = viewportRef.current
        if (!viewport) return
        viewport.scrollLeft = op.startScrollLeft - (evt.clientX - op.startX)
        viewport.scrollTop = op.startScrollTop - (evt.clientY - op.startY)
        return
      }

      const p = toPoint(evt, null)

      if (op.type === 'move-element') {
        setElements((prev) => prev.map((el) => (el.id === op.id ? { ...el, x: p.x - op.dx, y: p.y - op.dy } : el)))
        return
      }

      if (op.type === 'move-space') {
        setSpaces((prev) => prev.map((sp) => (sp.id === op.id ? { ...sp, x: p.x - op.dx, y: p.y - op.dy } : sp)))
        return
      }

      if (op.type === 'rotate-space') {
        setSpaces((prev) =>
          prev.map((sp) => {
            if (sp.id !== op.id) return sp
            const cx = sp.x + sp.w / 2
            const cy = sp.y + sp.h / 2
            const angle = Math.atan2(p.y - cy, p.x - cx) * (180 / Math.PI) + 90
            return { ...sp, angulo: Number(angle.toFixed(1)) }
          })
        )
        return
      }

      if (op.type === 'resize-space') {
        setSpaces((prev) =>
          prev.map((sp) => {
            if (sp.id !== op.id) return sp

            const ux = Math.cos(op.rad)
            const uy = Math.sin(op.rad)
            const vx = -Math.sin(op.rad)
            const vy = Math.cos(op.rad)

            const dx = p.x - op.anchorX
            const dy = p.y - op.anchorY

            const projectedW = dx * ux + dy * uy
            const projectedH = dx * vx + dy * vy

            const newW = clampPositive(projectedW, MIN_CELL_SIZE)
            const newH = clampPositive(projectedH, MIN_CELL_SIZE)

            const centerX = op.anchorX + (newW / 2) * ux + (newH / 2) * vx
            const centerY = op.anchorY + (newW / 2) * uy + (newH / 2) * vy

            return {
              ...sp,
              w: newW,
              h: newH,
              x: centerX - newW / 2,
              y: centerY - newH / 2,
            }
          })
        )
      }
      return
    }

    if (draft) {
      const p = toPoint(evt, GRID_DRAW_SNAP)
      setDraft((prev) => ({
        ...prev,
        w: Math.max(GRID_DRAW_SNAP, snap(p.x - prev.x, GRID_DRAW_SNAP)),
        h: Math.max(GRID_DRAW_SNAP, snap(p.y - prev.y, GRID_DRAW_SNAP)),
      }))
    }
  }

  const onMouseUp = () => {
    if (mode !== 'editor') return

    if (dragRef.current) {
      if (dragRef.current.type === 'pan') setIsPanning(false)
      dragRef.current = null
      return
    }

    if (!draft) return
    if (draft.w < GRID_DRAW_SNAP || draft.h < GRID_DRAW_SNAP) {
      setDraft(null)
      return
    }

    if (tool === 'wall' || tool === 'road') {
      setElements((prev) => [...prev, { id: uid(), type: tool, x: draft.x, y: draft.y, w: draft.w, h: draft.h }])
      setDraft(null)
      return
    }

    if (tool === 'space') {
      setPendingSpaceRect({ x: draft.x, y: draft.y, w: draft.w, h: draft.h })
      setDraft(null)
    }
  }

  const removeSelected = () => {
    if (!selected) return
    if (selected.kind === 'element') {
      setElements((prev) => prev.filter((e) => e.id !== selected.id))
    } else {
      setSpaces((prev) => prev.filter((e) => e.id !== selected.id))
    }
    setSelected(null)
  }

  const updateSelectedSpace = (updates) => {
    if (!selectedSpace) return
    setSpaces((prev) =>
      prev.map((sp) => {
        if (sp.id !== selectedSpace.id) return sp
        if (typeof updates === 'function') return { ...sp, ...updates(sp) }
        return { ...sp, ...updates }
      })
    )
  }

  const confirmNewSpace = ({ codigo, tipoVehiculo }) => {
    if (!pendingSpaceRect) return
    setSpaces((prev) => [
      ...prev,
      {
        id: uid(),
        codigo,
        tipoVehiculo,
        estado: 'DISPONIBLE',
        x: pendingSpaceRect.x,
        y: pendingSpaceRect.y,
        w: pendingSpaceRect.w,
        h: pendingSpaceRect.h,
        angulo: 0,
      },
    ])
    setPendingSpaceRect(null)
  }

  const startRotate = (evt, spaceId) => {
    evt.stopPropagation()
    evt.preventDefault()
    setSelected({ id: spaceId, kind: 'space' })
    dragRef.current = { type: 'rotate-space', id: spaceId }
  }

  const startResize = (evt, spaceId) => {
    evt.stopPropagation()
    evt.preventDefault()
    setSelected({ id: spaceId, kind: 'space' })
    const sp = spaces.find((s) => s.id === spaceId)
    if (!sp) return

    const rad = degToRad(Number(sp.angulo || 0))
    const cx = sp.x + sp.w / 2
    const cy = sp.y + sp.h / 2

    // Anchor fijo en la esquina opuesta al handle (top-left en coordenadas locales).
    const tlx = -sp.w / 2
    const tly = -sp.h / 2
    const anchorX = cx + tlx * Math.cos(rad) - tly * Math.sin(rad)
    const anchorY = cy + tlx * Math.sin(rad) + tly * Math.cos(rad)

    dragRef.current = { type: 'resize-space', id: spaceId, anchorX, anchorY, rad }
  }

  const save = () => {
    onSave?.(
      {
        elementos: elements.map((e) => ({ type: e.type, x: e.x, y: e.y, w: e.w, h: e.h })),
        ancho: canvasW,
        alto: canvasH,
      },
      spaces
    )
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0, background: C.bg }}>
      {mode === 'editor' && (
        <div
          style={{
            width: 160,
            flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            background: C.surface,
            padding: '10px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontFamily: FF,
          }}
        >
          <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>HERRAMIENTA</span>
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')}>
            Mover
          </ToolButton>
          <ToolButton active={tool === 'wall'} onClick={() => setTool('wall')}>
            Pared
          </ToolButton>
          <ToolButton active={tool === 'road'} onClick={() => setTool('road')}>
            Pasillo
          </ToolButton>
          <ToolButton active={tool === 'space'} onClick={() => setTool('space')}>
            Espacio
          </ToolButton>

          <button
            onClick={removeSelected}
            disabled={!selected}
            style={{
              marginTop: 4,
              padding: '7px 10px',
              borderRadius: 8,
              border: `1px solid ${selected ? '#ff4d6d66' : C.border}`,
              background: selected ? '#ff4d6d18' : C.s2,
              color: selected ? '#ff4d6d' : C.muted,
              cursor: selected ? 'pointer' : 'default',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: FF,
            }}
          >
            Eliminar
          </button>

          {selectedSpace && (
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
              <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>CELDA SELECCIONADA</span>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 10, marginBottom: 4 }}>Ancho</label>
                <input
                  type="number"
                  value={Math.round(selectedSpace.w)}
                  min={MIN_CELL_SIZE}
                  step={1}
                  onChange={(e) => {
                    const parsed = parseLocaleNumber(e.target.value)
                    if (parsed == null) return
                    const w = clampPositive(parsed, MIN_CELL_SIZE)
                    updateSelectedSpace((sp) => {
                      const cx = sp.x + sp.w / 2
                      return { w, x: cx - w / 2 }
                    })
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.s2,
                    color: C.text,
                    fontSize: 11,
                    fontFamily: FF,
                  }}
                />
              </div>
              <div style={{ marginTop: 6 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 10, marginBottom: 4 }}>Alto</label>
                <input
                  type="number"
                  value={Math.round(selectedSpace.h)}
                  min={MIN_CELL_SIZE}
                  step={1}
                  onChange={(e) => {
                    const parsed = parseLocaleNumber(e.target.value)
                    if (parsed == null) return
                    const h = clampPositive(parsed, MIN_CELL_SIZE)
                    updateSelectedSpace((sp) => {
                      const cy = sp.y + sp.h / 2
                      return { h, y: cy - h / 2 }
                    })
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.s2,
                    color: C.text,
                    fontSize: 11,
                    fontFamily: FF,
                  }}
                />
              </div>
              <div style={{ marginTop: 6 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 10, marginBottom: 4 }}>Angulo (grados)</label>
                <input
                  type="number"
                  value={Number(selectedSpace.angulo || 0).toFixed(1)}
                  step={0.1}
                  onChange={(e) => {
                    const parsed = parseLocaleNumber(e.target.value)
                    if (parsed == null) return
                    updateSelectedSpace({ angulo: Number(parsed.toFixed(1)) })
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.s2,
                    color: C.text,
                    fontSize: 11,
                    fontFamily: FF,
                  }}
                />
              </div>
              <p style={{ marginTop: 6, fontSize: 10, color: C.muted }}>Tip: usa el punto sobre la celda para girar y el cuadrado inferior para redimensionar.</p>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
            <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>TIPOS</span>
            <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
              {VEHICLE_TYPES.map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: VEHICLE_COLORS[t] }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {mode === 'editor' && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: '#11142ae6',
              backdropFilter: 'blur(4px)',
              fontFamily: FF,
            }}
          >
            <button
              onClick={() => setNavMode('cursor')}
              style={{
                borderRadius: 6,
                border: `1px solid ${navMode === 'cursor' ? '#5b7effaa' : C.border}`,
                background: navMode === 'cursor' ? '#5b7eff25' : C.s2,
                color: navMode === 'cursor' ? '#8fa5ff' : C.muted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
              }}
            >
              Cursor
            </button>
            <button
              onClick={() => setNavMode('hand')}
              style={{
                borderRadius: 6,
                border: `1px solid ${navMode === 'hand' ? '#5b7effaa' : C.border}`,
                background: navMode === 'hand' ? '#5b7eff25' : C.s2,
                color: navMode === 'hand' ? '#8fa5ff' : C.muted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
              }}
            >
              Mano
            </button>
            <button
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.s2,
                color: C.text,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              -
            </button>
            <button
              onClick={() => applyZoom(1)}
              style={{
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.s2,
                color: C.muted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 7px',
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.s2,
                color: C.text,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        )}

        <div ref={viewportRef} onWheel={onViewportWheel} style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
          <div style={{ width: `${Math.round(canvasW * zoom)}px`, height: `${Math.round(canvasH * zoom)}px`, transformOrigin: 'top left' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor:
                mode === 'editor'
                  ? isPanning
                    ? 'grabbing'
                    : navMode === 'hand'
                      ? 'grab'
                      : tool === 'select'
                        ? 'default'
                        : 'crosshair'
                  : 'default',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
          <rect x={0} y={0} width={canvasW} height={canvasH} fill={C.bg} />

          {planoImagen && <image href={planoImagen} x={0} y={0} width={canvasW} height={canvasH} preserveAspectRatio="xMidYMid meet" opacity={0.92} />}

          {mode === 'editor' && (
            <g opacity={0.08}>
              {Array.from({ length: Math.ceil(canvasW / GRID_RENDER) }).map((_, i) => (
                <line key={`gv-${i}`} x1={i * GRID_RENDER} y1={0} x2={i * GRID_RENDER} y2={canvasH} stroke={C.muted} strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.ceil(canvasH / GRID_RENDER) }).map((_, i) => (
                <line key={`gh-${i}`} x1={0} y1={i * GRID_RENDER} x2={canvasW} y2={i * GRID_RENDER} stroke={C.muted} strokeWidth={0.5} />
              ))}
            </g>
          )}

          {elements.map((el) => {
            const isSelected = selected?.id === el.id && selected?.kind === 'element'
            const fill = normalizeType(el.type) === 'wall' ? '#1f2136' : '#ffffff14'
            const stroke = isSelected ? '#5b7eff' : '#4d5071'
            return <rect key={el.id} x={el.x} y={el.y} width={el.w} height={el.h} fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1} rx={4} />
          })}

          {spaces.map((sp) => {
            const isSelected = selected?.id === sp.id && selected?.kind === 'space'
            const color = mode === 'editor' ? VEHICLE_COLORS[sp.tipoVehiculo] || C.accent : STATE_COLORS[sp.estado] || C.accent
            const isAvailable = sp.estado === 'DISPONIBLE'
            const cx = sp.x + sp.w / 2
            const cy = sp.y + sp.h / 2
            const angulo = Number(sp.angulo || 0)

            return (
              <g key={sp.id} transform={`translate(${cx} ${cy}) rotate(${angulo})`}>
                <g
                  onClick={() => {
                    if (mode === 'editor') {
                      setSelected({ id: sp.id, kind: 'space' })
                      return
                    }
                    if (isAvailable) onSelectEspacio?.(sp)
                  }}
                  style={{ cursor: mode === 'editor' ? 'pointer' : isAvailable ? 'pointer' : 'not-allowed' }}
                >
                  <rect
                    x={-sp.w / 2}
                    y={-sp.h / 2}
                    width={sp.w}
                    height={sp.h}
                    rx={8}
                    fill={`${color}22`}
                    stroke={isSelected ? '#fff' : color}
                    strokeWidth={isSelected ? 2.4 : 1.6}
                  />
                  <text x={0} y={-4} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily={FF}>
                    {sp.codigo}
                  </text>
                  <text x={0} y={10} textAnchor="middle" fill={color} fontSize={9} fontFamily={FF} opacity={0.85}>
                    {sp.tipoVehiculo}
                  </text>
                </g>

                {mode === 'editor' && isSelected && (
                  <g>
                    <line x1={0} y1={-sp.h / 2} x2={0} y2={-sp.h / 2 - 16} stroke="#ffffffcc" strokeWidth={1.2} />
                    <circle
                      cx={0}
                      cy={-sp.h / 2 - 22}
                      r={5.5}
                      fill="#5b7eff"
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      style={{ cursor: 'grab' }}
                      onMouseDown={(evt) => startRotate(evt, sp.id)}
                    />
                    <rect
                      x={sp.w / 2 - 5}
                      y={sp.h / 2 - 5}
                      width={10}
                      height={10}
                      rx={2}
                      fill="#5b7eff"
                      stroke="#ffffff"
                      strokeWidth={1}
                      style={{ cursor: 'nwse-resize' }}
                      onMouseDown={(evt) => startResize(evt, sp.id)}
                    />
                  </g>
                )}
              </g>
            )
          })}

          {draft && (
            <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="#5b7eff1a" stroke="#5b7eff" strokeDasharray="5 4" strokeWidth={1.4} rx={4} />
          )}
          </svg>
        </div>
        </div>

        {mode === 'editor' && (
          <div style={{ position: 'absolute', right: 18, bottom: 18 }}>
            <button
              onClick={save}
              style={{
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                background: GRAD,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: FF,
                fontWeight: 700,
                boxShadow: '0 4px 18px #5b7eff55',
              }}
            >
              Guardar mapa
            </button>
          </div>
        )}
      </div>

      {pendingSpaceRect && <SpaceModal onCancel={() => setPendingSpaceRect(null)} onConfirm={confirmNewSpace} />}
    </div>
  )
}
