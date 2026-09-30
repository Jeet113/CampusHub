import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { chatMessageSchema } from '../../src/validators/ai.validator.js'

describe('AI chatbot validator', () => {
  it('rejects an empty message', () => {
    const result = chatMessageSchema.safeParse({ message: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects missing message', () => {
    const result = chatMessageSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects a message exceeding 2000 characters', () => {
    const result = chatMessageSchema.safeParse({ message: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts valid message with empty history', () => {
    const result = chatMessageSchema.safeParse({
      message: 'How can I join a club?',
      conversationHistory: [],
    })
    expect(result.success).toBe(true)
    expect(result.data.message).toBe('How can I join a club?')
  })

  it('accepts valid message with multi-turn conversation history', () => {
    const result = chatMessageSchema.safeParse({
      message: 'Tell me more.',
      conversationHistory: [
        { role: 'user', content: 'What clubs are there?' },
        { role: 'model', content: 'We have tech, cultural, and sports clubs.' },
      ],
    })
    expect(result.success).toBe(true)
    expect(result.data.conversationHistory).toHaveLength(2)
  })
})

describe('AI chatbot endpoints security & routing', () => {
  const app = createApp()

  it('requires authentication for POST /api/v1/ai/chat', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .send({ message: 'Hello' })

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({
      success: false,
    })
  })

  it('requires authentication for alias POST /api/ai/chat', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Hello' })

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({
      success: false,
    })
  })

  it('rejects invalid token with 401', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', 'Bearer invalid-token-string')
      .send({ message: 'Hello' })

    expect(response.status).toBe(401)
  })
})
