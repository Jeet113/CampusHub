import express from 'express'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { createCorsOptions } from './config/cors.js'
import { getEnv } from './config/env.js'
import errorHandler from './middleware/error.middleware.js'
import notFound from './middleware/notFound.middleware.js'
import { apiRateLimit } from './middleware/rateLimit.middleware.js'
import routes from './routes/index.js'

export function createApp() {
  const app = express()
  const env = getEnv()

  app.disable('x-powered-by')
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors(createCorsOptions()))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(cookieParser())
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
  app.use('/api/v1', apiRateLimit, routes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

export default createApp
