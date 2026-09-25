import { describe, expect, it } from 'vitest'
import { seedClubSchema } from '../../src/validators/admin.validator.js'
import { registerSchema } from '../../src/validators/auth.validator.js'

describe('Admin Club Seeding Validator', () => {
  it('validates correct club seed payload', () => {
    const parsed = seedClubSchema.safeParse({
      name: 'CUET Robotics Society',
      clubId: 'ORG-001',
      email: 'robotics@campushub.local',
      password: 'ClubPassword123',
      category: 'Robotics',
      initials: 'RS',
      description: 'University robotics team.',
      established: 2018,
      accent: '#38BDF8',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.email).toBe('robotics@campushub.local')
      expect(parsed.data.category).toBe('Robotics')
    }
  })

  it('rejects short passwords or missing required fields in seed club', () => {
    const parsed = seedClubSchema.safeParse({
      name: 'C',
      clubId: 'O',
      email: 'invalid-email',
      password: 'short',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('Student-Only Public Registration Validator', () => {
  it('allows valid student registration payload with OTP', () => {
    const parsed = registerSchema.safeParse({
      name: 'Jane Doe',
      studentId: '2104050',
      email: 'jane@campushub.local',
      password: 'Password123',
      department: 'Computer Science',
      otp: '123456',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.role).toBe('student')
    }
  })

  it('rejects public registration if role is specified as club or admin', () => {
    const parsedClub = registerSchema.safeParse({
      name: 'Club Rep',
      studentId: 'ORG-001',
      email: 'rep@campushub.local',
      password: 'Password123',
      department: 'Clubs',
      role: 'club',
      otp: '123456',
    })
    expect(parsedClub.success).toBe(false)
  })
})
