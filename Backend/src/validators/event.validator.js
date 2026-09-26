import { z } from 'zod'
import { objectId, paginationFields } from './common.validator.js'

const eventFields = {
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(180),
  club: objectId.optional(),
  description: z.string().trim().min(2, 'Description must be at least 2 characters').max(5000),
  category: z.string().trim().min(2, 'Category is required').max(60),
  date: z.coerce.date({ message: 'Valid event date is required' }),
  startTime: z.string().trim().min(1, 'Start time is required').max(30),
  endTime: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined),
    z.string().max(30).optional(),
  ),
  location: z.string().trim().min(2, 'Location must be at least 2 characters').max(250),
  capacity: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) return undefined
    const num = Number(val)
    return num >= 1 ? num : undefined
  }, z.number().int().min(1).optional()),
  status: z.enum(['draft', 'pending']).optional(),
}

export const createEventSchema = z.object(eventFields)
export const updateEventSchema = z
  .object(Object.fromEntries(Object.entries(eventFields).map(([key, value]) => [key, value.optional()])))
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const eventStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'cancelled', 'completed', 'ended']),
})
export const eventQuerySchema = z.object({
  ...paginationFields,
  club: z.string().trim().max(100).optional(),
  mine: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'cancelled', 'completed', 'ended']).optional(),
  sort: z.enum(['date', '-date', 'newest', 'popular']).default('date'),
})
