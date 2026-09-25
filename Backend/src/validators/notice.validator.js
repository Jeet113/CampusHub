import { z } from 'zod'
import { optionalBoolean, paginationFields } from './common.validator.js'

const noticeFields = {
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(180),
  description: z.string().trim().min(2, 'Description must be at least 2 characters').max(5000),
  category: z.string().trim().min(2).max(60).default('General'),
  important: z.boolean().optional(),
  status: z.enum(['draft', 'pending', 'published']).optional(),
  expiresAt: z.coerce.date().optional(),
}

export const createNoticeSchema = z.object(noticeFields)
export const updateNoticeSchema = z
  .object(Object.fromEntries(Object.entries(noticeFields).map(([key, value]) => [key, value.optional()])))
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const noticeQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  important: optionalBoolean,
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'archived']).optional(),
})
