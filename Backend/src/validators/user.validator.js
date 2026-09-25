import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    department: z.string().trim().min(2).max(120).optional(),
    batch: z.string().trim().max(30).optional(),
    phone: z.string().trim().max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    notificationPreferences: z
      .object({
        email: z.boolean().optional(),
        eventReminders: z.boolean().optional(),
        clubUpdates: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/),
})
