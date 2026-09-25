import crypto from 'node:crypto'
import Otp from '../models/Otp.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { sendOtpEmail } from './email.service.js'

export function generateNumericOtp(length = 6) {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length)
  return crypto.randomInt(min, max).toString()
}

export async function sendSignupOtp(email) {
  const normalizedEmail = email.toLowerCase().trim()

  const existingUser = await User.exists({ email: normalizedEmail })
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists')
  }

  // Throttle requests: check if an OTP was created less than 45 seconds ago
  const existingOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'signup',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (existingOtp) {
    const elapsedMs = Date.now() - new Date(existingOtp.createdAt).getTime()
    if (elapsedMs < 45 * 1000) {
      const waitSeconds = Math.ceil((45 * 1000 - elapsedMs) / 1000)
      throw new ApiError(429, `Please wait ${waitSeconds}s before requesting a new code`)
    }
  }

  // Clean up any previous signup OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail, purpose: 'signup' })

  const otpCode = generateNumericOtp(6)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await Otp.create({
    email: normalizedEmail,
    otp: otpCode,
    purpose: 'signup',
    expiresAt,
  })

  await sendOtpEmail({
    email: normalizedEmail,
    otp: otpCode,
    purpose: 'CampusHub Sign-Up Verification',
  })

  return { message: 'Verification code sent to your email' }
}

export async function verifySignupOtp(email, otp) {
  const normalizedEmail = email.toLowerCase().trim()
  const cleanOtp = String(otp).trim()

  const record = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'signup',
    expiresAt: { $gt: new Date() },
  })

  if (!record) {
    throw new ApiError(400, 'Verification code has expired or is invalid. Please request a new code.')
  }

  if (record.attempts >= 5) {
    await Otp.deleteOne({ _id: record._id })
    throw new ApiError(429, 'Too many failed attempts. Please request a new verification code.')
  }

  if (record.otp !== cleanOtp) {
    record.attempts += 1
    await record.save()
    const remaining = 5 - record.attempts
    throw new ApiError(
      400,
      `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`,
    )
  }

  // Verification succeeded - remove the OTP so it cannot be reused
  await Otp.deleteOne({ _id: record._id })
  return true
}
