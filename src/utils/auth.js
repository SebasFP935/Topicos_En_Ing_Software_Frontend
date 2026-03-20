// src/utils/auth.js
import { fixMojibake, normalizeTextPayload } from './text'

const TOKEN_KEY   = 'np_token'
const REFRESH_KEY = 'np_refresh'
const USER_KEY    = 'np_user'
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

export const auth = {
  message(value, fallback = '') {
    const base = value ?? fallback
    return fixMojibake(typeof base === 'string' ? base : String(base ?? ''))
  },

  normalize(value) {
    return normalizeTextPayload(value)
  },

  async readJson(response, fallback = null) {
    try {
      return normalizeTextPayload(await response.json())
    } catch {
      return fallback
    }
  },

  save(response) {
    localStorage.setItem(TOKEN_KEY,   response.accessToken)
    localStorage.setItem(REFRESH_KEY, response.refreshToken)
    localStorage.setItem(USER_KEY,    JSON.stringify({
      id:       response.usuarioId,
      email:    response.email,
      nombre:   response.nombre,
      apellido: response.apellido,
      rol:      response.rol,
    }))
  },

  token()             { return localStorage.getItem(TOKEN_KEY)   },
  refreshToken()      { return localStorage.getItem(REFRESH_KEY) },
  user()              { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null },
  isAuthenticated()   { return !!localStorage.getItem(TOKEN_KEY) },
  isAdmin()           { return this.user()?.rol === 'ADMIN' },
  isOperador()        { return this.user()?.rol === 'OPERADOR' },
  isAdminOrOperador() { return ['ADMIN', 'OPERADOR'].includes(this.user()?.rol) },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },

  publicHeaders() {
    return { ...BASE_HEADERS }
  },

  headers() {
    const token = this.token()
    return token
      ? { ...BASE_HEADERS, 'Authorization': `Bearer ${token}` }
      : this.publicHeaders()
  },

  async tryRefresh() {
    const rt = this.refreshToken()
    if (!rt) return false
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method:  'POST',
        headers: this.publicHeaders(),
        body:    JSON.stringify({ refreshToken: rt }),
      })
      if (!res.ok) return false
      this.save(await this.readJson(res))
      return true
    } catch {
      return false
    }
  },

  async fetchAuth(url, options = {}) {
    const fullUrl = `${API_BASE}${url}`
    const res = await fetch(fullUrl, {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    })
    if (res.status !== 401) return res
    const ok = await this.tryRefresh()
    if (!ok) {
      this.clear()
      window.location.href = '/login'
      return res
    }
    return fetch(fullUrl, { 
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    })
  },
}
