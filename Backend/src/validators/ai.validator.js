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

export const clubRecommendationSchema = z.object({
  interests: z
    .array(z.string().trim().min(1, 'Interest cannot be empty'))
    .min(1, 'Please select at least one interest'),
  goal: z
    .string({ required_error: 'Please select your primary goal' })
    .trim()
    .min(1, 'Please select your primary goal'),
  experienceLevel: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.enum(['Beginner', 'Intermediate', 'Experienced'], {
      errorMap: () => ({ message: 'Please select a valid experience level' }),
    }),
  ),
  availableTime: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string({ required_error: 'Please select your available time' })
      .min(1, 'Please select your available time'),
  ),
})

