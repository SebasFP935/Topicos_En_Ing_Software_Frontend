// src/utils/auth.js
const TOKEN_KEY   = 'np_token'
const REFRESH_KEY = 'np_refresh'
const USER_KEY    = 'np_user'

export const auth = {
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

  token()           { return localStorage.getItem(TOKEN_KEY)   },
  refreshToken()    { return localStorage.getItem(REFRESH_KEY) },
  user()            { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null },
  isAuthenticated() { return !!localStorage.getItem(TOKEN_KEY) },
  isAdmin()         { return this.user()?.rol === 'ADMIN' },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },

  headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token()}`,
    }
  },

  // Intenta renovar el access token usando el refresh token
  async tryRefresh() {
    const rt = this.refreshToken()
    if (!rt) return false
    try {
      const res = await fetch('/api/auth/refresh', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: rt }),
      })
      if (!res.ok) return false
      this.save(await res.json())
      return true
    } catch {
      return false
    }
  },

  // Reemplaza fetch() en toda la app — renueva token si expira (401)
  async fetchAuth(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    })

    if (res.status !== 401) return res

    // Token expirado — intentar refresh
    const ok = await this.tryRefresh()
    if (!ok) {
      this.clear()
      window.location.href = '/login'
      return res
    }

    // Reintentar con el nuevo token
    return fetch(url, {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    })
  },
}