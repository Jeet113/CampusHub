import { z } from 'zod'

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase())
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number')

const baseRegistration = {
  name: z.string().trim().min(2).max(100),
  email,
  password,
  department: z.string().trim().min(2).max(120),
  batch: z.string().trim().max(30).optional(),
  otp: z.string().trim().length(6, 'Verification code must be 6 digits'),
}

export const registerSchema = z.object({
  ...baseRegistration,
  role: z.literal('student').default('student'),
  studentId: z.string().trim().min(2).max(40),
})

export const sendOtpSchema = z.object({ email })
export const verifyOtpSchema = z.object({
  email,
  otp: z.string().trim().length(6, 'Verification code must be 6 digits'),
})
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) })
export const refreshSchema = z.object({ refreshToken: z.string().optional() }).default({})
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(256), password })

