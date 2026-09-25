import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import { changePassword, getProfile, replaceAvatar, updateProfile } from '../services/user.service.js'

export async function getMe(request, response) {
  return response.json(new ApiResponse(await getProfile(request.user._id), 'Profile retrieved'))
}

export async function updateMe(request, response) {
  return response.json(new ApiResponse(await updateProfile(request.user._id, input(request, 'body')), 'Profile updated'))
}

export async function updatePassword(request, response) {
  const { currentPassword, newPassword } = input(request, 'body')
  await changePassword(request.user._id, currentPassword, newPassword)
  return response.json(new ApiResponse(null, 'Password changed. Please sign in again.'))
}

export async function uploadAvatar(request, response) {
  const user = await replaceAvatar(request.user._id, request.file)
  const imageUrl = user.profileImage?.imageUrl || user.profileImage?.url
  const cloudinaryPublicId = user.profileImage?.cloudinaryPublicId || user.profileImage?.publicId
  return response.json(
    new ApiResponse(user, 'Avatar updated', {
      imageUrl,
      cloudinaryPublicId,
    }),
  )
}
