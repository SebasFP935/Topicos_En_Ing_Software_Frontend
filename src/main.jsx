import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.jsx'
import { normalizeTextPayload } from './utils/text'
import './styles.css'

// Normaliza mojibake en cualquier payload JSON recibido por fetch.
if (typeof window !== 'undefined' && !window.__noparkingFetchPatched) {
  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args)
    const baseJson = response.json?.bind(response)
    if (typeof baseJson === 'function') {
      response.json = async () => normalizeTextPayload(await baseJson())
    }
    return response
  }
  window.__noparkingFetchPatched = true
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>
)
