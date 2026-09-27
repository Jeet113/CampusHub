import mongoose from 'mongoose'

export const assetSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      trim: true,
      get(v) {
        return v || this.get?.('url', null, { getters: false }) || undefined
      },
    },
    url: {
      type: String,
      trim: true,
      get(v) {
        return v || this.get?.('imageUrl', null, { getters: false }) || undefined
      },
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
      get(v) {
        return v || this.get?.('publicId', null, { getters: false }) || undefined
      },
    },
    publicId: {
      type: String,
      trim: true,
      get(v) {
        return v || this.get?.('cloudinaryPublicId', null, { getters: false }) || undefined
      },
    },
    resourceType: { type: String, enum: ['image', 'raw'], default: 'image' },
  },
  {
    _id: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
)

assetSchema.pre('validate', function () {
  if (this.url && !this.imageUrl) this.imageUrl = this.url
  if (this.imageUrl && !this.url) this.url = this.imageUrl
  if (this.publicId && !this.cloudinaryPublicId) this.cloudinaryPublicId = this.publicId
  if (this.cloudinaryPublicId && !this.publicId) this.publicId = this.cloudinaryPublicId
})

export function cleanJson(_document, returned) {
  delete returned.__v
  delete returned.password
  delete returned.refreshTokenHash
  delete returned.passwordResetTokenHash
  delete returned.passwordResetExpiresAt
  return returned
}
