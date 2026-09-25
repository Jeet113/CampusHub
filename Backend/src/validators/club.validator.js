import { z } from 'zod'
import { optionalBoolean, paginationFields } from './common.validator.js'

const clubFields = {
  name: z.string().trim().min(2).max(150),
  initials: z.preprocess((val) => {
    if (typeof val !== 'string' || !val.trim()) return undefined
    return val.trim().slice(0, 10).toUpperCase()
  }, z.string().min(1).max(10)),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(2).max(1000),
  mission: z.string().trim().max(1000).optional(),
  established: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) return undefined
    const num = Number(val)
    return num >= 1800 ? num : undefined
  }, z.number().int().min(1800).max(new Date().getFullYear()).optional()),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}

export const createClubSchema = z.object(clubFields)
export const updateClubSchema = z
  .object(Object.fromEntries(Object.entries(clubFields).map(([key, value]) => [key, value.optional()])))
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const clubQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  verified: optionalBoolean,
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
})
export const memberQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(['pending', 'approved', 'rejected', 'removed']).optional(),
})
export const updateMemberSchema = z
  .object({
    role: z.enum(['member', 'executive', 'president']).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'removed']).optional(),
  })
  .refine((value) => value.role || value.status, 'Role or status is required')
