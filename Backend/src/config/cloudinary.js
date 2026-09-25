import { v2 as cloudinary } from 'cloudinary'
import { getEnv } from './env.js'
import ApiError from '../utils/ApiError.js'

let configured = false

export function getCloudinary() {
  const env = getEnv()
  const hasKeys = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  const hasUrl = Boolean(env.CLOUDINARY_URL)

  if (!hasKeys && !hasUrl) {
    throw new ApiError(503, 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env')
  }

  if (!configured) {
    if (hasKeys) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      })
    } else if (hasUrl) {
      cloudinary.config({
        cloudinary_url: env.CLOUDINARY_URL,
        secure: true,
      })
    }
    configured = true
  }
  return cloudinary
}

