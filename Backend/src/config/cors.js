import ApiError from '../utils/ApiError.js'
import { getEnv } from './env.js'

export function createCorsOptions() {
  const env = getEnv()
  const allowedOrigins = env.CLIENT_URL
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true)

      const cleanOrigin = origin.replace(/\/+$/, '')
      if (allowedOrigins.includes(cleanOrigin)) return callback(null, true)

      // In non-production environments, allow any localhost or 127.0.0.1 port (e.g. 5173, 5174, 5175, 3000)
      if (env.NODE_ENV !== 'production') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        if (isLocalhost) return callback(null, true)
      }

      // Allow Vercel preview or production deployments if any .vercel.app origin is configured
      const hasVercelAllowed = allowedOrigins.some((o) => o.includes('.vercel.app'))
      if (hasVercelAllowed && /^https:\/\/[a-z0-9-]+[a-z0-9]\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true)
      }

      return callback(new ApiError(403, 'Origin is not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }
}

