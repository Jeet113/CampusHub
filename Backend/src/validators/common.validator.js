import { z } from 'zod'

export const idParams = z.object({ id: z.string().trim().min(1).max(180) })
export const memberParams = z.object({
  id: z.string().trim().min(1).max(180),
  memberId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid membership id'),
})

export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
}

export const optionalBoolean = z.preprocess((value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}, z.boolean().optional())

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')
