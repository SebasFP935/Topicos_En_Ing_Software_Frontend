const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-forwarded-server',
  'x-real-ip',
  'x-vercel-id',
])

function buildTargetUrl(req, apiBase) {
  const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase
  const requestUrl = new URL(req.url || '/api/', 'http://localhost')
  const queryPath =
    Array.isArray(req.query?.path) ? req.query.path.join('/') :
    typeof req.query?.path === 'string' ? req.query.path :
    ''
  const pathnamePath = requestUrl.pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')
  const path = pathnamePath || queryPath
  const target = new URL(path ? `${base}/api/${path}` : `${base}/api/`)

  requestUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })

  return target
}

function buildHeaders(req) {
  const headers = new Headers()

  Object.entries(req.headers).forEach(([key, value]) => {
    if (!value || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  })

  headers.set('ngrok-skip-browser-warning', 'true')
  return headers
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  if (req.body == null) return undefined
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return req.body
  return JSON.stringify(req.body)
}

export default async function handler(req, res) {
  const apiBase = process.env.VITE_API_URL

  if (!apiBase) {
    res.status(500).json({ mensaje: 'VITE_API_URL no está configurada en Vercel.' })
    return
  }

  try {
    const upstream = await fetch(buildTargetUrl(req, apiBase), {
      method: req.method,
      headers: buildHeaders(req),
      body: await readBody(req),
    })

    res.status(upstream.status)

    upstream.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return
      res.setHeader(key, value)
    })

    const body = Buffer.from(await upstream.arrayBuffer())
    res.send(body)
  } catch (error) {
    res.status(502).json({
      mensaje: 'No se pudo conectar con el backend.',
      detalle: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
