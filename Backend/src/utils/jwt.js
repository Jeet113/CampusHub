import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { getEnv } from '../config/env.js'

const basePayload = (user, type) => ({ sub: user._id.toString(), role: user.role, type })

export function signAccessToken(user) {
  const env = getEnv()
  return jwt.sign(basePayload(user, 'access'), env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  })
}

export function signRefreshToken(user) {
  const env = getEnv()
  return jwt.sign({ ...basePayload(user, 'refresh'), jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  })
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, getEnv().JWT_ACCESS_SECRET)
  if (payload.type !== 'access') throw new jwt.JsonWebTokenError('Invalid access token type')
  return payload
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, getEnv().JWT_REFRESH_SECRET)
  if (payload.type !== 'refresh') throw new jwt.JsonWebTokenError('Invalid refresh token type')
  return payload
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function secureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}
