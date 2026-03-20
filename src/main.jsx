import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.jsx'
import { getVercelAnalyticsProps } from './analytics/vercel.js'
import './styles/upb-theme.css'

const analyticsProps = getVercelAnalyticsProps()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      {analyticsProps && <Analytics {...analyticsProps} />}
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>
)
