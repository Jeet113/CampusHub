import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/jwt.js'
import asyncHandler from '../utils/asyncHandler.js'

function bearerToken(request) {
  const [scheme, token] = (request.get('authorization') || '').split(' ')
  return scheme?.toLowerCase() === 'bearer' ? token : null
}

async function resolveUser(request) {
  const token = bearerToken(request)
  if (!token) return null
  const payload = verifyAccessToken(token)
  const user = await User.findById(payload.sub)
  if (!user) throw new ApiError(401, 'Authentication required')
  if (user.status === 'suspended') throw new ApiError(403, 'This account is suspended')
  return user
}

export const authenticate = asyncHandler(async (request, _response, next) => {
  const user = await resolveUser(request)
  if (!user) throw new ApiError(401, 'Authentication required')
  request.user = user
  next()
})

export const optionalAuthenticate = asyncHandler(async (request, _response, next) => {
  request.user = await resolveUser(request)
  next()
})
