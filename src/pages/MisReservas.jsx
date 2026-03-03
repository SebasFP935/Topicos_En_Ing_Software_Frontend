import { useState } from 'react'
import { Clock, Calendar, ParkingSquare, CheckCircle, AlertTriangle, X, CircleCheck } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'

const FF = "'Plus Jakarta Sans', sans-serif"

const ACTIVAS = [
  { spot: 'A-12', bloque: 'Horario B', fecha: 'Hoy',       hora: '10:00 - 12:00', estado: 'activa',     color: '#3de8c8' },
  { spot: 'A-07', bloque: 'Horario A', fecha: 'Manana',    hora: '7:45 - 9:45',   estado: 'confirmada', color: '#5b7eff' },
  { spot: 'B-03', bloque: 'Horario C', fecha: 'Jueves 20', hora: '12:15 - 14:15', estado: 'confirmada', color: '#a259ff' },
]
const HISTORIAL = [
  { spot: 'A-09', bloque: 'Horario B', fecha: 'Lun 16', hora: '10:00-12:00', estado: 'completada' },
  { spot: 'C-02', bloque: 'Horario C', fecha: 'Vie 13', hora: '12:15-14:15', estado: 'completada' },
  { spot: 'A-04', bloque: 'Horario A', fecha: 'Mar 10', hora: '7:45-9:45',   estado: 'no-show'    },
]
const EST = {
  activa:     { label: 'Activa',     color: '#3de8c8', Icon: CheckCircle    },
  confirmada: { label: 'Confirmada', color: '#5b7eff', Icon: Calendar       },
  completada: { label: 'Completada', color: '#6b7099', Icon: CircleCheck    },
  'no-show':  { label: 'No-show',    color: '#ff4d6d', Icon: AlertTriangle  },
}

export default function MisReservas() {
  const [tab, setTab] = useState('activas')
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 28px 56px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28, fontFamily: FF }}><GradText>Mis reservas</GradText></h1>

      {/* Tabs */}
      <div style={{ display: 'flex', background: C.s2, borderRadius: 12, padding: 4, marginBottom: 28, border: '1px solid ' + C.border, width: 'fit-content', gap: 2 }}>
        {[['activas','Activas'],['historial','Historial']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '9px 28px', borderRadius: 10, border: 'none',
            background: tab === id ? GRAD : 'transparent',
            color: tab === id ? '#fff' : C.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: FF,
          }}>{label}</button>
        ))}
      </div>

      {tab === 'activas' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {ACTIVAS.map(r => {
            const E = EST[r.estado]
            return (
              <Card key={r.spot}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: r.color + '16', border: '1px solid ' + r.color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ParkingSquare size={22} color={r.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: FF }}>Espacio {r.spot}</p>
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: FF }}>{r.bloque} · UPB</p>
                    </div>
                  </div>
                  <Badge color={E.color}>{E.label}</Badge>
                </div>
                <div style={{ background: C.bg, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} color={C.muted} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: FF }}>{r.fecha}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color={C.muted} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, fontFamily: FF }}>{r.hora}</span>
                  </div>
                </div>
                {r.estado === 'activa' && (
                  <button style={{ width: '100%', marginTop: 12, background: '#ff4d6d12', border: '1px solid #ff4d6d28', color: '#ff4d6d', padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', fontFamily: FF }}>
                    <X size={14} /> Cancelar reserva
                  </button>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
          {HISTORIAL.map(r => {
            const E = EST[r.estado]
            const Icon = E.Icon
            return (
              <Card key={r.spot + r.fecha} style={{ opacity: r.estado === 'no-show' ? 0.78 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: E.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={E.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FF }}>Espacio {r.spot} · {r.bloque}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <Clock size={11} color={C.muted} />
                        <p style={{ fontSize: 12, color: C.muted, fontFamily: FF }}>{r.fecha} · {r.hora}</p>
                      </div>
                    </div>
                  </div>
                  <Badge color={E.color}>{E.label}</Badge>
                </div>
              </Card>
            )
          })}
          <Card style={{ background: C.warn + '09', borderColor: C.warn + '30', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={17} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: FF }}>
                Tienes <strong style={{ color: C.warn }}>1 no-show</strong> registrado. Al acumular 3 se aplica penalizacion de 48h sin poder reservar.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
