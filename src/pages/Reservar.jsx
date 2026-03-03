import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, ParkingSquare, CircleCheck } from 'lucide-react'
import { C, GRAD, BLOQUES, DISPONIBLES, TOTAL } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

const DIAS = [
  { label: 'Hoy',    sub: 'Mier 18', tag: 'hoy'    },
  { label: 'Manana', sub: 'Jue 19',  tag: 'manana'  },
  { label: 'Pasado', sub: 'Vie 20',  tag: 'pasado'  },
]

const FF = "'Plus Jakarta Sans', sans-serif"

export default function Reservar() {
  const [dia,    setDia]   = useState('manana')
  const [bloq1,  setBloq1] = useState(null)
  const [bloq2,  setBloq2] = useState(null)
  const [done,   setDone]  = useState(false)

  const disp    = bloq1 ? DISPONIBLES[dia][bloq1] : null
  const idx1    = BLOQUES.findIndex(b => b.id === bloq1)
  const idx2    = BLOQUES.findIndex(b => b.id === bloq2)
  const contig  = bloq2 && Math.abs(idx1 - idx2) === 1
  const valid   = bloq1 && (!bloq2 || contig)

  function handleBloq(id) {
    if (!bloq1)       { setBloq1(id); return }
    if (bloq1 === id) { setBloq1(null); setBloq2(null); return }
    if (!bloq2)       { setBloq2(id); return }
    if (bloq2 === id) { setBloq2(null); return }
    setBloq1(id); setBloq2(null)
  }

  if (done) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 48px rgba(91,126,255,.4)' }}>
        <CheckCircle size={40} color="#fff" />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: FF }}><GradText>Reserva confirmada!</GradText></h2>
      <Card style={{ width: '100%' }}>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontFamily: FF }}>Espacio asignado</p>
        <p style={{ fontSize: 36, fontWeight: 800, fontFamily: FF }}><GradText>A-07</GradText></p>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontFamily: FF }}>
          {bloq1 && BLOQUES.find(b => b.id === bloq1)?.time}
          {bloq2 && ' → ' + BLOQUES.find(b => b.id === bloq2)?.time}
        </p>
      </Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={16} color={C.teal} />
        <p style={{ fontSize: 13, color: C.muted, fontFamily: FF }}>Confirmacion enviada a tu email institucional</p>
      </div>
      <Button variant="ghost" onClick={() => { setDone(false); setBloq1(null); setBloq2(null) }}>
        Nueva reserva
      </Button>
    </div>
  )

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '36px 28px 56px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, fontFamily: FF }}><GradText>Nueva reserva</GradText></h1>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 36, fontFamily: FF }}>Puedes reservar hasta 2 dias de anticipacion</p>

      {/* Selector de dia */}
      <SectionLabel style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={14} style={{ display: 'inline' }} /> Selecciona el dia
      </SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36, maxWidth: 480 }}>
        {DIAS.map(d => {
          const on = dia === d.tag
          return (
            <button key={d.tag} onClick={() => { setDia(d.tag); setBloq1(null); setBloq2(null) }} style={{
              background: on ? GRAD : C.s2,
              border: '1.5px solid ' + (on ? 'transparent' : C.border),
              borderRadius: 16, padding: '16px 10px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: on ? 'rgba(255,255,255,.8)' : C.muted, fontFamily: FF }}>{d.label}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: on ? '#fff' : C.text, fontFamily: FF }}>{d.sub.split(' ')[1]}</span>
              <span style={{ fontSize: 11, color: on ? 'rgba(255,255,255,.65)' : C.muted, fontFamily: FF }}>{d.sub.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Selector de bloques */}
      <SectionLabel style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={14} style={{ display: 'inline' }} /> Selecciona tu horario
      </SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
        {BLOQUES.map(b => {
          const avail  = DISPONIBLES[dia][b.id]
          const isSel1 = bloq1 === b.id
          const isSel2 = bloq2 === b.id
          const isSel  = isSel1 || isSel2
          const busy   = avail < 10
          return (
            <button key={b.id} onClick={() => handleBloq(b.id)} style={{
              background: isSel ? GRAD : C.s2,
              border: '1.5px solid ' + (isSel ? 'transparent' : busy ? C.warn + '50' : C.border),
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              position: 'relative', overflow: 'hidden', transition: 'transform .12s',
              transform: isSel ? 'scale(1.02)' : 'scale(1)',
            }}>
              {isSel && (
                <div style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(255,255,255,.2)', borderRadius: 100, padding: '1px 8px', fontSize: 10, color: '#fff', fontWeight: 600, fontFamily: FF }}>
                  {isSel1 ? (bloq2 ? '1ro' : 'Sel.') : '2do'}
                </div>
              )}
              <p style={{ fontSize: 12, fontWeight: 600, color: isSel ? 'rgba(255,255,255,.8)' : C.muted, marginBottom: 4, fontFamily: FF }}>{b.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: isSel ? '#fff' : C.text, marginBottom: 8, fontFamily: FF }}>{b.time}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: busy ? C.warn : isSel ? 'rgba(255,255,255,.7)' : C.teal }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: isSel ? 'rgba(255,255,255,.75)' : C.muted, fontFamily: FF }}>{avail} disponibles</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Disponibilidad real-time */}
      {bloq1 && (
        <Card style={{ marginBottom: 16, borderColor: C.teal + '35' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ParkingSquare size={24} color={C.teal} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.teal, fontFamily: FF }}>
                {disp} espacios disponibles
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 2, fontFamily: FF }}>
                de {TOTAL} totales para Horario {bloq1}{bloq2 ? ' + ' + bloq2 : ''}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 12, background: C.border, borderRadius: 100, height: 6, overflow: 'hidden' }}>
            <div style={{ width: ((TOTAL - disp) / TOTAL * 100) + '%', height: '100%', background: GRAD, borderRadius: 100, transition: 'width .4s' }} />
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'right', fontFamily: FF }}>{TOTAL - disp} ocupados · {disp} libres</p>
        </Card>
      )}

      {/* Regla */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.warn + '0d', border: '1px solid ' + C.warn + '30', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
        <AlertTriangle size={16} color={C.warn} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, fontFamily: FF }}>
          Puedes reservar hasta <strong style={{ color: C.warn }}>2 bloques consecutivos</strong> (max. 4h 15min).
          {bloq2 && !contig && <span style={{ color: C.danger }}> Los bloques seleccionados no son consecutivos.</span>}
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        disabled={!valid}
        onClick={() => valid && setDone(true)}
        icon={CircleCheck}
        style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 15 }}
      >
        {!bloq1 ? 'Selecciona un horario' : 'Confirmar reserva'}
      </Button>
      {valid && <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 10, fontFamily: FF }}>Recibiras confirmacion por email con tu espacio asignado</p>}
    </div>
  )
}
