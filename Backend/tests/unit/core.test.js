import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { registerSchema } from '../../src/validators/auth.validator.js'
import { getPagination, paginationMeta } from '../../src/utils/pagination.js'
import { hashToken, signAccessToken, verifyAccessToken } from '../../src/utils/jwt.js'

describe('backend foundation', () => {
  const app = createApp()

  it('returns a consistent 404 response', async () => {
    const response = await request(app).get('/api/v1/not-a-route')
    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ success: false, errors: [] })
  })

  it('reports database state through the health endpoint', async () => {
    const response = await request(app).get('/api/v1/health')
    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({ message: 'CampusHub API is running', database: 'disconnected' })
  })

  it('rejects invalid query pagination before accessing the database', async () => {
    const response = await request(app).get('/api/v1/events?page=0&limit=101')
    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.errors.length).toBeGreaterThan(0)
  })
})

describe('validation and security helpers', () => {
  it('never permits public admin registration', () => {
    const parsed = registerSchema.safeParse({
      name: 'Admin',
      email: 'admin@example.test',
      password: 'Password123',
      role: 'admin',
      department: 'Administration',
    })
    expect(parsed.success).toBe(false)
  })

  it('caps pagination at safe values', () => {
    expect(getPagination({ page: '-2', limit: '5000' })).toEqual({ page: 1, limit: 100, skip: 0 })
    expect(paginationMeta(2, 12, 25)).toEqual({ page: 2, limit: 12, total: 25, pages: 3 })
  })

  it('signs typed access tokens and hashes opaque tokens', () => {
    const user = { _id: '507f1f77bcf86cd799439011', role: 'student' }
    const token = signAccessToken(user)
    expect(verifyAccessToken(token)).toMatchObject({ sub: user._id, role: 'student', type: 'access' })
    expect(hashToken('token')).toHaveLength(64)
    expect(hashToken('token')).not.toBe('token')
  })
})
