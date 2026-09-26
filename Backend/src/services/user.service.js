import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { uploadBuffer, safelyDeleteAsset } from './cloudinary.service.js'

export async function getProfile(userId) {
  const user = await User.findById(userId).populate('club', 'name slug status logo')
  if (!user) throw new ApiError(404, 'User not found')
  if (user.role === 'admin' && !user.profileImage?.url) {
    user.profileImage = { url: '/admin-avatar.png' }
  }
  return user
}

export async function updateProfile(userId, data) {
  const allowed = ['name', 'department', 'batch', 'phone', 'bio']
  const changes = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)))
  for (const [key, value] of Object.entries(data.notificationPreferences || {})) {
    changes[`notificationPreferences.${key}`] = value
  }
  const user = await User.findByIdAndUpdate(userId, { $set: changes }, { new: true, runValidators: true })
  if (!user) throw new ApiError(404, 'User not found')
  return user
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password +refreshTokenHash')
  if (!user || !(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect')
  if (await user.comparePassword(newPassword)) throw new ApiError(400, 'New password must be different')
  user.password = newPassword
  user.refreshTokenHash = undefined
  await user.save()
}

export async function replaceAvatar(userId, file) {
  if (!file) throw new ApiError(400, 'Avatar image is required')
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  const previous = user.profileImage?.toObject?.() || user.profileImage
  const uploaded = await uploadBuffer(file, 'profiles')
  try {
    user.profileImage = uploaded
    await user.save()
  } catch (error) {
    await safelyDeleteAsset(uploaded)
    throw error
  }
  await safelyDeleteAsset(previous)
  return user
}
