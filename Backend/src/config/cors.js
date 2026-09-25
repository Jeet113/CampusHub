import ApiError from '../utils/ApiError.js'
import { getEnv } from './env.js'

export function createCorsOptions() {
  const allowedOrigins = getEnv()
    .CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new ApiError(403, 'Origin is not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}
