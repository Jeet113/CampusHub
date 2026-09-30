import ApiError from '../utils/ApiError.js'
import { getEnv } from './env.js'

export function createCorsOptions() {
  const env = getEnv()
  const allowedOrigins = env.CLIENT_URL
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)

      // In non-production environments, allow any localhost or 127.0.0.1 port (e.g. 5173, 5174, 5175, 3000)
      if (env.NODE_ENV !== 'production') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        if (isLocalhost) return callback(null, true)
      }

      return callback(new ApiError(403, 'Origin is not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }
}

