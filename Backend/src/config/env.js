import dotenv from 'dotenv'
import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { z } from 'zod'

export const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url))
export const backendEnvPath = fileURLToPath(new URL('../../.env', import.meta.url))

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath })
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
}
dotenv.config()

const blankToUndefined = (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value)
const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional()).default('')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.preprocess(blankToUndefined, z.string().min(1, 'MONGODB_URI is required')),
  JWT_ACCESS_SECRET: z.preprocess(
    blankToUndefined,
    z.string().min(32, 'JWT_ACCESS_SECRET must contain at least 32 characters'),
  ),
  JWT_REFRESH_SECRET: z.preprocess(
    blankToUndefined,
    z.string().min(32, 'JWT_REFRESH_SECRET must contain at least 32 characters'),
  ),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: optionalText,
  CLOUDINARY_API_KEY: optionalText,
  CLOUDINARY_API_SECRET: optionalText,
  CLOUDINARY_URL: optionalText,
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SEED_PASSWORD: optionalText,
  EMAIL_USER: optionalText,
  EMAIL_PASS: optionalText,
  GEMINI_API_KEY: optionalText,
  GEMINI_MODEL: z.string().trim().default('gemini-3.5-flash-lite'),
})

let cachedEnv

export function getEnv() {
  if (cachedEnv) return cachedEnv
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment configuration: ${details}`)
  }
  cachedEnv = Object.freeze(result.data)
  return cachedEnv
}

export function resetEnvCacheForTests() {
  if (process.env.NODE_ENV === 'test') cachedEnv = undefined
}
