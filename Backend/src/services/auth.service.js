import Club from '../models/Club.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { getEnv } from '../config/env.js'
import { hashToken, secureToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { verifySignupOtp } from './otp.service.js'

async function issueTokens(user) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  user.refreshTokenHash = hashToken(refreshToken)
  await user.save({ validateBeforeSave: false })
  return { accessToken, refreshToken }
}

export async function registerUser(data) {
  if (data.role && data.role !== 'student') {
    throw new ApiError(403, 'Organization and Admin accounts are created by university administration')
  }
  if (await User.exists({ email: data.email })) throw new ApiError(409, 'Email already registered')
  if (data.studentId && (await User.exists({ studentId: data.studentId }))) {
    throw new ApiError(409, 'Student ID is already registered')
  }

  if (data.otp) {
    await verifySignupOtp(data.email, data.otp)
  } else if (getEnv().NODE_ENV !== 'test') {
    throw new ApiError(400, 'Verification code is required')
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'student',
    studentId: data.studentId,
    department: data.department,
    batch: data.batch,
  })

  const tokens = await issueTokens(user)
  return { user: user.toJSON(), ...tokens }
}

export async function loginUser(data) {
  const user = await User.findOne({ email: data.email }).select('+password +refreshTokenHash')
  if (!user || !(await user.comparePassword(data.password))) throw new ApiError(401, 'Invalid email or password')
  if (user.status === 'suspended') throw new ApiError(403, 'This account is suspended')
  if (user.role === 'club' && !user.profileImage?.url) {
    const linkedClub = await Club.findOne({ $or: [{ _id: user.club }, { createdBy: user._id }] })
    if (linkedClub?.logo?.url) {
      user.profileImage = linkedClub.logo
    }
  } else if (user.role === 'admin' && !user.profileImage?.url) {
    user.profileImage = { url: '/admin-avatar.png' }
  }
  const tokens = await issueTokens(user)
  return { user: user.toJSON(), ...tokens }
}

export async function rotateRefreshToken(token) {
  if (!token) throw new ApiError(401, 'Refresh token is required')
  const payload = verifyRefreshToken(token)
  const user = await User.findById(payload.sub).select('+refreshTokenHash')
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
    throw new ApiError(401, 'Refresh token is invalid or has been revoked')
  }
  if (user.status === 'suspended') throw new ApiError(403, 'This account is suspended')
  if (user.role === 'club' && !user.profileImage?.url) {
    const linkedClub = await Club.findOne({ $or: [{ _id: user.club }, { createdBy: user._id }] })
    if (linkedClub?.logo?.url) {
      user.profileImage = linkedClub.logo
    }
  } else if (user.role === 'admin' && !user.profileImage?.url) {
    user.profileImage = { url: '/admin-avatar.png' }
  }
  const tokens = await issueTokens(user)
  return { user: user.toJSON(), ...tokens }
}

export async function logoutUser(token) {
  if (!token) return
  try {
    const payload = verifyRefreshToken(token)
    await User.updateOne(
      { _id: payload.sub, refreshTokenHash: hashToken(token) },
      { $unset: { refreshTokenHash: 1 } },
    )
  } catch {
    // Logout remains idempotent for expired or otherwise invalid cookies.
  }
}

export async function beginPasswordReset(email) {
  const user = await User.findOne({ email })
  if (!user) return null
  const token = secureToken()
  user.passwordResetTokenHash = hashToken(token)
  user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)
  await user.save({ validateBeforeSave: false })
  return getEnv().NODE_ENV === 'production' ? null : token
}

export async function resetPassword(token, password) {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt +refreshTokenHash')
  if (!user) throw new ApiError(400, 'Password reset token is invalid or expired')

  user.password = password
  user.passwordResetTokenHash = undefined
  user.passwordResetExpiresAt = undefined
  user.refreshTokenHash = undefined
  await user.save()
}
