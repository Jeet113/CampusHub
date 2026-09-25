import mongoose from 'mongoose'

export const assetSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    resourceType: { type: String, enum: ['image', 'raw'], default: 'image' },
  },
  { _id: false },
)

export function cleanJson(_document, returned) {
  delete returned.__v
  delete returned.password
  delete returned.refreshTokenHash
  delete returned.passwordResetTokenHash
  delete returned.passwordResetExpiresAt
  return returned
}
