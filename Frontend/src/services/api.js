const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const ACCESS_TOKEN_KEY = 'campushub_access_token'
const REFRESH_TOKEN_KEY = 'campushub_refresh_token'

let accessToken = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null

export class ApiClientError extends Error {
  constructor(message, status, errors = []) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}

export function setAccessToken(token) {
  accessToken = token || null
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function setRefreshToken(token) {
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getStoredRefreshToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
}

export function clearTokens() {
  setAccessToken(null)
  setRefreshToken(null)
}

export function getAssetUrl(asset) {
  if (!asset) return null
  const url = typeof asset === 'string' ? asset : (asset.imageUrl || asset.url)
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  if (url.startsWith('/uploads')) {
    const base = API_URL.replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  if (url.startsWith('/')) return url
  const base = API_URL.replace(/\/api\/v1\/?$/, '')
  return `${base}/${url}`
}


async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    throw new ApiClientError(payload?.message || `Request failed with status ${response.status}`, response.status, payload?.errors)
  }
  return payload
}

async function refreshAccessToken() {
  const storedRefresh = getStoredRefreshToken()
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storedRefresh ? { refreshToken: storedRefresh } : {}),
  })
  const payload = await parseResponse(response)
  setAccessToken(payload.data.accessToken)
  if (payload.data.refreshToken) {
    setRefreshToken(payload.data.refreshToken)
  }
  return accessToken
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  const isForm = options.body instanceof FormData
  if (!isForm && options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: isForm || typeof options.body === 'string' || options.body === undefined ? options.body : JSON.stringify(options.body),
  })

  if (response.status === 401 && !options.skipRefresh && path !== '/auth/refresh') {
    try {
      await refreshAccessToken()
      return apiRequest(path, { ...options, skipRefresh: true })
    } catch {
      clearTokens()
    }
  }
  return parseResponse(response)
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export { API_URL }
