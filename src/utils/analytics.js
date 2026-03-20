import ReactGA from 'react-ga4'

const GA_ID = ''

export const initGA = () => {
  if (!GA_ID) return
  ReactGA.initialize(GA_ID, {
    gaOptions: { send_page_view: false }, // lo mandamos manualmente
  })
}

// Page views (SPA — hay que dispararlos manual)
export const trackPage = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

// Eventos custom
export const trackEvent = (category, action, label = '', value = 0) => {
  ReactGA.event({ category, action, label, value })
}