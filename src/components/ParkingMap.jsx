/**
 * ParkingMap.jsx
 * Componente canvas SVG reutilizable para el plano de parqueo.
 *
 * Props:
 *  mode         : 'editor' | 'reserva'
 *  plano        : { elementos: [{type:'pared'|'pasillo', x,y,w,h}], ancho, alto }
 *  espacios     : [{id, codigo, x,y,w,h, tipoVehiculo, estado}]
 *  onSave       : (plano, espacios) => void   — solo en modo editor
 *  onSelectEspacio : (espacio) => void        — solo en modo reserva
 *  franjaActual : string                      — franja seleccionada (para disponibilidad)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { MousePointer2, RectangleHorizontal, Square, ParkingSquare, Trash2 } from 'lucide-react'
import { C, GRAD } from '../tokens'

const GRID    = 20          // px snap
const FF = 'var(--ff-apple)'
const W_PARED = '#3a3c5c'
const W_PAS   = '#1a1c35'

const TIPOS_VEHICULO = ['AUTO', 'MOTO', 'BICICLETA', 'DISCAPACIDAD']
const TV_COLOR = {
  AUTO:         '#3ec9ff',
  MOTO:         '#ff4f9a',
  BICICLETA:    '#7dff63',
  DISCAPACIDAD: '#ffbf47',
}
const ESTADO_COLOR = {
  DISPONIBLE:  '#ff4d6d',
  OCUPADO:     '#ff4d6d',
  BLOQUEADO:   '#6f7686',
  MANTENIMIENTO: '#ff6b88',
}

const snap = v => Math.round(v / GRID) * GRID
const uid  = () => Math.random().toString(36).slice(2, 8)

// ── Herramienta botón ─────────────────────────────────────────────────────
function ToolBtn({ active, onClick, children, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 16px', borderRadius: 12,
        background: active ? GRAD : 'rgba(255,255,255,.02)',
        color: active ? '#fff' : C.text,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        fontFamily: FF, transition: 'all .15s',
        border: `1px solid ${active ? 'transparent' : C.border}`,
        letterSpacing: '.01em',
      }}
    >{children}</button>
  )
}

// ── Paleta lateral ────────────────────────────────────────────────────────
function Palette({ tool, setTool, onDelete, seleccionado }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '16px 12px', background: 'linear-gradient(180deg, rgba(9,12,17,.94), rgba(9,12,17,.82))',
      borderRight: `1px solid ${C.border}`, minWidth: 158,
      backdropFilter: 'blur(8px)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 760, color: C.muted, fontFamily: FF, marginBottom: 6, letterSpacing: 1.2 }}>HERRAMIENTA</p>
      <ToolBtn active={tool === 'select'}   onClick={() => setTool('select')}  title="Seleccionar"><MousePointer2 size={14} />Mover</ToolBtn>
      <ToolBtn active={tool === 'pared'}    onClick={() => setTool('pared')}   title="Dibujar pared"><RectangleHorizontal size={14} />Pared</ToolBtn>
      <ToolBtn active={tool === 'pasillo'}  onClick={() => setTool('pasillo')} title="Dibujar pasillo"><Square size={13} />Pasillo</ToolBtn>
      <ToolBtn active={tool === 'espacio'}  onClick={() => setTool('espacio')} title="Colocar espacio"><ParkingSquare size={14} />Espacio</ToolBtn>

      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 760, color: C.muted, fontFamily: FF, marginBottom: 7, letterSpacing: 1.2 }}>LEYENDA</p>
        {Object.entries(TV_COLOR).map(([tipo, color]) => (
          <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 11.5, color: C.muted, fontFamily: FF }}>{tipo}</span>
          </div>
        ))}
      </div>

      {seleccionado && (
        <button
          onClick={onDelete}
          style={{
            marginTop: 10, padding: '10px 11px', borderRadius: 11,
            background: '#ff4d6d18', border: '1px solid #ff4d6d40',
            color: '#ff4d6d', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: FF, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        ><Trash2 size={14} />Eliminar</button>
      )}
    </div>
  )
}

// ── Modal nuevo espacio ───────────────────────────────────────────────────
function ModalEspacio({ rect, onConfirm, onCancel }) {
  const [codigo, setCodigo] = useState('')
  const [tipo,   setTipo]   = useState('AUTO')
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.02) 44%, rgba(255,255,255,.01)), #07090d',
        border: `1px solid rgba(255,255,255,.12)`,
        borderRadius: 24, padding: 30, minWidth: 390,
        boxShadow: '0 28px 60px rgba(0,0,0,.45)',
      }}>
        <p style={{ fontSize: 27, fontWeight: 820, color: C.text, fontFamily: FF, marginBottom: 20, letterSpacing: '-.02em' }}>
          Nuevo espacio
        </p>
        <label style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Codigo</label>
        <input
          value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
          placeholder="ej. A-01"
          style={{
            display: 'block', width: '100%', marginTop: 4, marginBottom: 14,
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`,
            color: C.text, fontSize: 15, fontFamily: FF, boxSizing: 'border-box',
          }}
        />
        <label style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Tipo de vehiculo</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 20 }}>
          {TIPOS_VEHICULO.map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{
                padding: '8px 13px', borderRadius: 10,
                background: tipo === t ? TV_COLOR[t] + '2b' : 'rgba(255,255,255,.02)',
                border: `1px solid ${tipo === t ? TV_COLOR[t] : C.border}`,
                color: tipo === t ? TV_COLOR[t] : C.muted,
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
              }}
            >{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 12,
            background: 'rgba(255,255,255,.02)', border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: FF,
          }}>Cancelar</button>
          <button
            disabled={!codigo.trim()}
            onClick={() => onConfirm({ codigo: codigo.trim(), tipoVehiculo: tipo })}
            style={{
              flex: 2, padding: '11px', borderRadius: 12, border: 'none',
              background: codigo.trim() ? GRAD : C.border,
              color: '#fff', fontSize: 14.5, fontWeight: 760,
              cursor: codigo.trim() ? 'pointer' : 'default', fontFamily: FF,
            }}
          >Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal confirmar reserva ───────────────────────────────────────────────
function ModalReserva({ espacio, franjas, onConfirm, onCancel }) {
  const [franja, setFranja] = useState(franjas?.[0]?.id || '')
  const [fecha,  setFecha]  = useState(new Date().toISOString().split('T')[0])
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'linear-gradient(155deg, rgba(255,255,255,.09), rgba(255,255,255,.02) 44%, rgba(255,255,255,.01)), #07090d',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 24, padding: 30, minWidth: 420,
        boxShadow: '0 28px 60px rgba(0,0,0,.45)',
      }}>
        <p style={{ fontSize: 26, fontWeight: 820, color: C.text, fontFamily: FF, marginBottom: 5, letterSpacing: '-.02em' }}>
          Reservar espacio
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: TV_COLOR[espacio.tipoVehiculo] + '18',
          border: `1px solid ${TV_COLOR[espacio.tipoVehiculo]}40`,
          borderRadius: 10, padding: '7px 12px', marginBottom: 20,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: TV_COLOR[espacio.tipoVehiculo] }} />
          <span style={{ fontSize: 14, fontWeight: 740, color: TV_COLOR[espacio.tipoVehiculo], fontFamily: FF }}>
            {espacio.codigo} · {espacio.tipoVehiculo}
          </span>
        </div>

        <label style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Fecha</label>
        <input
          type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{
            display: 'block', width: '100%', marginTop: 4, marginBottom: 14,
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,.03)', border: `1px solid ${C.border}`,
            color: C.text, fontSize: 15, fontFamily: FF, boxSizing: 'border-box',
          }}
        />
        <label style={{ fontSize: 11.5, color: C.muted, fontFamily: FF, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Franja horaria</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, marginBottom: 20 }}>
          {(franjas || []).map(f => (
            <button
              key={f.id}
              onClick={() => setFranja(f.id)}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: franja === f.id ? GRAD : 'rgba(255,255,255,.02)',
                border: `1px solid ${franja === f.id ? 'transparent' : C.border}`,
                color: franja === f.id ? '#fff' : C.text,
                fontSize: 14, fontWeight: 650, cursor: 'pointer',
                fontFamily: FF, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>{f.label}</span>
              <span style={{ opacity: 0.7 }}>{f.time}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 12,
            background: 'rgba(255,255,255,.02)', border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: FF,
          }}>Cancelar</button>
          <button
            onClick={() => onConfirm({ espacioId: espacio.id, franjaId: franja, fecha })}
            style={{
              flex: 2, padding: '11px', borderRadius: 12, border: 'none',
              background: GRAD, color: '#fff', fontSize: 14.5, fontWeight: 760,
              cursor: 'pointer', fontFamily: FF,
            }}
          >Confirmar reserva</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function ParkingMap({
  mode = 'reserva',
  plano: planoInicial,
  espacios: espaciosIniciales = [],
  franjas = [],
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
  const [drawing,      setDrawing]      = useState(null)   // {x,y,w,h}
  const [modal,        setModal]        = useState(null)   // {rect}
  const [modalReserva, setModalReserva] = useState(null)   // espacio

  const svgRef = useRef()
  const dragRef = useRef(null)   // {id, tipo, ox, oy}

  // ── Coordenadas SVG desde evento ───────────────────────────────────────
  const getSVGPoint = useCallback(e => {
    const svg  = svgRef.current
    const rect = svg.getBoundingClientRect()
    const scaleX = ANCHO / rect.width
    const scaleY = ALTO  / rect.height
    return {
      x: snap((e.clientX - rect.left) * scaleX),
      y: snap((e.clientY - rect.top)  * scaleY),
    }
  }, [ANCHO, ALTO])

  // ── MOUSE DOWN ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback(e => {
    if (mode !== 'editor') return
    const pt = getSVGPoint(e)

    if (tool === 'select') {
      // clic en elemento o espacio → seleccionar y preparar drag
      const hit = [...elementos, ...espacios].find(el =>
        pt.x >= el.x && pt.x <= el.x + el.w &&
        pt.y >= el.y && pt.y <= el.y + el.h
      )
      setSelId(hit?.id || null)
      if (hit) {
        dragRef.current = { id: hit.id, ox: pt.x - hit.x, oy: pt.y - hit.y }
      }
      return
    }

    // dibujar rectángulo
    setDrawing({ x: pt.x, y: pt.y, w: 0, h: 0 })
    setSelId(null)
  }, [mode, tool, elementos, espacios, getSVGPoint])

  // ── MOUSE MOVE ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback(e => {
    if (mode !== 'editor') return
    const pt = getSVGPoint(e)

    if (dragRef.current) {
      const { id, ox, oy } = dragRef.current
      const mover = arr => arr.map(el =>
        el.id === id ? { ...el, x: snap(pt.x - ox), y: snap(pt.y - oy) } : el
      )
      setElementos(prev => mover(prev))
      setEspacios(prev => mover(prev))
      return
    }

    if (drawing) {
      setDrawing(prev => ({
        ...prev,
        w: Math.max(GRID, snap(pt.x - prev.x)),
        h: Math.max(GRID, snap(pt.y - prev.y)),
      }))
    }
  }, [mode, drawing, getSVGPoint])

  // ── MOUSE UP ───────────────────────────────────────────────────────────
  const onMouseUp = useCallback(e => {
    if (mode !== 'editor') return
    dragRef.current = null

    if (!drawing || drawing.w < GRID || drawing.h < GRID) {
      setDrawing(null)
      return
    }

    const rect = { ...drawing, id: uid() }

    if (tool === 'pared' || tool === 'pasillo') {
      setElementos(prev => [...prev, { ...rect, type: tool }])
      setDrawing(null)
    } else if (tool === 'espacio') {
      setModal({ rect })
      setDrawing(null)
    }
  }, [mode, tool, drawing])

  // ── Confirmar modal espacio ────────────────────────────────────────────
  const confirmarEspacio = ({ codigo, tipoVehiculo }) => {
    setEspacios(prev => [...prev, {
      ...modal.rect, codigo, tipoVehiculo, estado: 'DISPONIBLE',
    }])
    setModal(null)
  }

  // ── Eliminar seleccionado ──────────────────────────────────────────────
  const eliminarSeleccionado = () => {
    setElementos(prev => prev.filter(e => e.id !== selId))
    setEspacios(prev  => prev.filter(e => e.id !== selId))
    setSelId(null)
  }

  // ── Guardar ────────────────────────────────────────────────────────────
  const guardar = () => {
    onSave?.({ elementos, ancho: ANCHO, alto: ALTO }, espacios)
  }

  // ── Clic en espacio (modo reserva) ────────────────────────────────────
  const clicEspacio = espacio => {
    if (mode !== 'reserva') return
    if (espacio.estado !== 'DISPONIBLE') return
    if (franjas.length > 0) {
      setModalReserva(espacio)
    } else {
      onSelectEspacio?.(espacio)
    }
  }

  // ── Render SVG ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: 'rgba(5,6,8,.76)' }}>

      {/* Paleta solo en editor */}
      {mode === 'editor' && (
        <Palette
          tool={tool} setTool={setTool}
          seleccionado={!!selId}
          onDelete={eliminarSeleccionado}
        />
      )}

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          style={{
            width: '100%', maxWidth: ANCHO,
            display: 'block', cursor: mode === 'editor'
              ? (tool === 'select' ? 'default' : 'crosshair')
              : 'default',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {/* Fondo */}
          <rect x={0} y={0} width={ANCHO} height={ALTO} fill={C.bg} />

          {/* Grid (solo editor) */}
          {mode === 'editor' && (
            <g opacity={0.08}>
              {Array.from({ length: Math.ceil(ANCHO / GRID) }).map((_, i) => (
                <line key={'v'+i} x1={i*GRID} y1={0} x2={i*GRID} y2={ALTO} stroke={C.muted} strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.ceil(ALTO / GRID) }).map((_, i) => (
                <line key={'h'+i} x1={0} y1={i*GRID} x2={ANCHO} y2={i*GRID} stroke={C.muted} strokeWidth={0.5} />
              ))}
            </g>
          )}

          {/* Elementos decorativos (paredes, pasillos) */}
          {elementos.map(el => (
            <g key={el.id}>
              <rect
                x={el.x} y={el.y} width={el.w} height={el.h}
                fill={el.type === 'pared' ? W_PARED : W_PAS}
                stroke={selId === el.id ? '#7ba5ff' : (el.type === 'pared' ? '#4a4c6c' : '#2a2c4c')}
                strokeWidth={selId === el.id ? 2 : 1}
                rx={el.type === 'pasillo' ? 4 : 2}
              />
              {mode === 'editor' && (
                <text
                  x={el.x + el.w/2} y={el.y + el.h/2 + 4}
                  textAnchor="middle" fontSize={9}
                  fill={C.muted} fontFamily={FF} fontWeight={600}
                  pointerEvents="none"
                >{el.type === 'pared' ? 'PARED' : 'PASILLO'}</text>
              )}
            </g>
          ))}

          {/* Rectángulo en construcción */}
          {drawing && (
            <rect
              x={drawing.x} y={drawing.y} width={drawing.w || 1} height={drawing.h || 1}
              fill={tool === 'espacio' ? '#7ba5ff18' : (tool === 'pared' ? '#3a3c5c80' : '#1a1c3580')}
              stroke={tool === 'espacio' ? '#7ba5ff' : C.muted}
              strokeWidth={1.5} strokeDasharray="4 3" rx={2}
            />
          )}

          {/* Espacios de parqueo */}
          {espacios.map(esp => {
            const disponible = esp.estado === 'DISPONIBLE'
            const color  = mode === 'reserva'
              ? (disponible ? ESTADO_COLOR.DISPONIBLE : ESTADO_COLOR[esp.estado] || C.muted)
              : TV_COLOR[esp.tipoVehiculo] || C.accent
            const isSel = selId === esp.id
            const fontSize = Math.min(esp.w, esp.h) < 40 ? 8 : 10

            return (
              <g
                key={esp.id}
                onClick={() => {
                  if (mode === 'editor') { setSelId(esp.id); return }
                  clicEspacio(esp)
                }}
                style={{ cursor: mode === 'reserva' && disponible ? 'pointer' : mode === 'editor' ? 'pointer' : 'not-allowed' }}
              >
                <rect
                  x={esp.x + 2} y={esp.y + 2}
                  width={esp.w - 4} height={esp.h - 4}
                  fill={color + '20'}
                  stroke={isSel ? '#fff' : color}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  rx={4}
                />
                {/* Indicador disponibilidad en modo reserva */}
                {mode === 'reserva' && (
                  <circle
                    cx={esp.x + esp.w - 8} cy={esp.y + 8}
                    r={4}
                    fill={disponible ? ESTADO_COLOR.DISPONIBLE : ESTADO_COLOR[esp.estado] || C.muted}
                  />
                )}
                <text
                  x={esp.x + esp.w/2} y={esp.y + esp.h/2 - (mode === 'reserva' ? 3 : 2)}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight={700}
                  fill={color}
                  fontFamily={FF}
                  pointerEvents="none"
                >{esp.codigo}</text>
                {mode === 'reserva' && (
                  <text
                    x={esp.x + esp.w/2} y={esp.y + esp.h/2 + fontSize + 1}
                    textAnchor="middle"
                    fontSize={fontSize - 1}
                    fill={color} opacity={0.6}
                    fontFamily={FF} pointerEvents="none"
                  >{esp.tipoVehiculo?.slice(0, 4)}</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Barra guardar (solo editor) */}
      {mode === 'editor' && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          display: 'flex', gap: 8,
        }}>
          <button
            onClick={guardar}
            style={{
              padding: '13px 26px', borderRadius: 14, border: 'none',
              background: GRAD, color: '#fff', fontSize: 15,
              fontWeight: 760, cursor: 'pointer', fontFamily: FF,
              boxShadow: '0 10px 30px rgba(0,140,255,.30)',
            }}
          >Guardar mapa</button>
        </div>
      )}

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

