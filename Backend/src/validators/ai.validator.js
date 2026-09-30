import { z } from 'zod'

export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .optional()
    .default([]),
})
