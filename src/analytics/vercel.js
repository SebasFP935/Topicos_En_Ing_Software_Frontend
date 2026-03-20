import { track } from '@vercel/analytics'

const env = import.meta.env

const CUSTOM_ENDPOINTS = {
  scriptSrc: env.VITE_VERCEL_ANALYTICS_SCRIPT_SRC,
  eventEndpoint: env.VITE_VERCEL_ANALYTICS_EVENT_ENDPOINT,
  viewEndpoint: env.VITE_VERCEL_ANALYTICS_VIEW_ENDPOINT,
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

function normalizeSegment(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function normalizePropertyValue(value) {
  if (!hasValue(value)) return undefined
  if (['string', 'number', 'boolean'].includes(typeof value)) return value

  if (typeof value === 'object') {
    if (typeof value.nombre === 'string') return value.nombre
    if (typeof value.label === 'string') return value.label
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

export function hasCustomVercelAnalyticsEndpoints() {
  return Object.values(CUSTOM_ENDPOINTS).every(hasValue)
}

function isGitHubPagesHost() {
  return typeof window !== 'undefined' && /github\.io$/i.test(window.location.hostname)
}

export function getVercelAnalyticsProps() {
  const baseProps = {
    mode: env.PROD ? 'production' : 'development',
  }

  if (env.DEV) {
    return baseProps
  }

  if (hasCustomVercelAnalyticsEndpoints()) {
    return {
      ...baseProps,
      ...CUSTOM_ENDPOINTS,
    }
  }

  // En Vercel directo se pueden usar los endpoints por defecto.
  // En GitHub Pages los necesitamos explicitos para no romper el tracking.
  return isGitHubPagesHost() ? null : baseProps
}

export function trackAppEvent(category, action, label = '', value) {
  if (!env.DEV && !hasCustomVercelAnalyticsEndpoints() && isGitHubPagesHost()) {
    return
  }

  const eventName =
    [category, action].map(normalizeSegment).filter(Boolean).join('_') || 'custom_event'

  const properties = {
    category: normalizePropertyValue(category),
    action: normalizePropertyValue(action),
  }

  const normalizedLabel = normalizePropertyValue(label)
  if (hasValue(normalizedLabel)) {
    properties.label = normalizedLabel
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    properties.value = value
  }

  track(eventName, properties)
}
