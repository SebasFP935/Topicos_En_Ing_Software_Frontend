import { trackAppEvent } from '../analytics/vercel'

export const initGA = () => {}

export const trackPage = () => {}

export const trackEvent = (category, action, label = '', value = 0) => {
  trackAppEvent(category, action, label, value)
}
