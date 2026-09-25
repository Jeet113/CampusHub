import { v2 as cloudinary } from 'cloudinary'
import { getEnv } from './env.js'
import ApiError from '../utils/ApiError.js'

let configured = false

export function getCloudinary() {
  const env = getEnv()
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(503, 'Cloudinary is not configured')
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}
