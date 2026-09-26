import { z } from 'zod'

export const approvalSchema = z.object({
  type: z.enum(['club', 'event', 'notice']),
  reason: z.string().trim().max(500).optional(),
})
export const userStatusSchema = z.object({ status: z.enum(['active', 'suspended']) })
export const clubStatusSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected', 'suspended']) })
export const eventStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'published', 'rejected', 'cancelled', 'completed', 'ended']),
})
export const seedClubSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  clubId: z.string().trim().min(2, 'Club ID must be at least 2 characters').max(40),
  email: z.string().trim().email('Invalid email address').max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  category: z.preprocess((val) => (typeof val === 'string' && val.trim() ? val.trim() : 'Technology'), z.string().max(60)),
  initials: z.preprocess((val) => {
    if (typeof val !== 'string' || !val.trim()) return undefined
    return val.trim().slice(0, 10).toUpperCase()
  }, z.string().max(10).optional()),
  description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined),
    z.string().max(1000).optional(),
  ),
  established: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) return undefined
    const num = Number(val)
    return num >= 1800 ? num : undefined
  }, z.number().int().min(1800).max(new Date().getFullYear()).optional()),
  accent: z.preprocess(
    (val) => (typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val.trim()) ? val.trim() : '#F59E0B'),
    z.string().optional(),
  ),
})

export const searchQuerySchema = z.object({ q: z.string().trim().min(1).max(100) })

