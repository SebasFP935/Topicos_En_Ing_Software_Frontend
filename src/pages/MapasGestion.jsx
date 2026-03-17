import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Building2, PencilLine } from 'lucide-react'
import { C, GRAD } from '../tokens'
import { Card } from '../components/ui/Card'
import { GradText } from '../components/ui/GradText'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Button } from '../components/ui/Button'
import { auth } from '../utils/auth'

const FF = "'Plus Jakarta Sans', sans-serif"

export default function MapasGestion() {
  const navigate = useNavigate()
  const [sedes, setSedes] = useState([])
  const [zonas, setZonas] = useState([])
  const [sedeId, setSedeId] = useState(null)
  const [loadingSedes, setLoadingSedes] = useState(true)
  const [loadingZonas, setLoadingZonas] = useState(false)

  useEffect(() => {
    let mounted = true

    auth
      .fetchAuth('/api/sedes')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return
        const list = Array.isArray(data) ? data : []
        setSedes(list)
        if (list.length > 0) setSedeId(list[0].id)
      })
      .catch(() => {
        if (mounted) setSedes([])
      })
      .finally(() => {
        if (mounted) setLoadingSedes(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!sedeId) return
    let mounted = true
    setLoadingZonas(true)

    auth
      .fetchAuth(`/api/zonas/sede/${sedeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return
        setZonas(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (mounted) setZonas([])
      })
      .finally(() => {
        if (mounted) setLoadingZonas(false)
      })

    return () => {
      mounted = false
    }
  }, [sedeId])

  const sedeActual = useMemo(() => sedes.find((s) => s.id === sedeId), [sedes, sedeId])

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '36px 28px 56px', fontFamily: FF }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>
        <GradText>Gestion de mapas</GradText>
      </h1>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 26 }}>
        Admin y Operador pueden cargar el plano base y editar los espacios por zona.
      </p>

      <SectionLabel>Sede</SectionLabel>
      {loadingSedes ? (
        <Card>
          <p style={{ color: C.muted, fontSize: 13 }}>Cargando sedes...</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
          {sedes.map((s) => {
            const active = s.id === sedeId
            return (
              <button
                key={s.id}
                onClick={() => setSedeId(s.id)}
                style={{
                  background: active ? GRAD : C.surface,
                  border: `1px solid ${active ? 'transparent' : C.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: active ? '#fff' : C.text,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Building2 size={15} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.nombre}</span>
                </div>
                <p style={{ fontSize: 12, opacity: active ? 0.9 : 0.75 }}>{s.direccion || 'Sin direccion'}</p>
              </button>
            )
          })}
        </div>
      )}

      <SectionLabel>Zonas {sedeActual ? `- ${sedeActual.nombre}` : ''}</SectionLabel>
      {loadingZonas ? (
        <Card>
          <p style={{ color: C.muted, fontSize: 13 }}>Cargando zonas...</p>
        </Card>
      ) : zonas.length === 0 ? (
        <Card>
          <p style={{ color: C.muted, fontSize: 13 }}>No hay zonas activas para esta sede.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {zonas.map((z) => (
            <Card key={z.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Map size={16} color={C.accent} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{z.nombre}</span>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{z.tipo}</span>
              </div>

              <p style={{ fontSize: 12, color: C.muted, minHeight: 34 }}>
                {z.descripcion || 'Sin descripcion de zona'}
              </p>

              <Button
                variant="primary"
                icon={PencilLine}
                style={{ justifyContent: 'center' }}
                onClick={() => navigate(`/mapas/zonas/${z.id}/editor`)}
              >
                Editar mapa
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
