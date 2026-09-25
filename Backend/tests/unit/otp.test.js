import { describe, expect, it } from 'vitest'
import { generateNumericOtp } from '../../src/services/otp.service.js'
import { registerSchema, sendOtpSchema } from '../../src/validators/auth.validator.js'

describe('OTP service and validator', () => {
  it('generates a 6-digit numeric OTP', () => {
    const otp = generateNumericOtp(6)
    expect(otp).toHaveLength(6)
    expect(/^\d{6}$/.test(otp)).toBe(true)
  })

  it('validates sendOtpSchema correctly', () => {
    const valid = sendOtpSchema.safeParse({ email: 'student@campus.edu' })
    expect(valid.success).toBe(true)

    const invalid = sendOtpSchema.safeParse({ email: 'not-an-email' })
    expect(invalid.success).toBe(false)
  })

  it('validates registration with OTP code', () => {
    const validStudent = registerSchema.safeParse({
      name: 'Valid Student',
      email: 'valid.student@campus.edu',
      password: 'Password123',
      role: 'student',
      studentId: 'STU-12345',
      department: 'Computer Science',
      otp: '123456',
    })
    expect(validStudent.success).toBe(true)

    const invalidOtp = registerSchema.safeParse({
      name: 'Valid Student',
      email: 'valid.student@campus.edu',
      password: 'Password123',
      role: 'student',
      studentId: 'STU-12345',
      department: 'Computer Science',
      otp: '123', // Less than 6 digits
    })
    expect(invalidOtp.success).toBe(false)
  })
})
