import mongoose from 'mongoose'
import { NOTICE_STATUSES } from '../constants/statuses.js'
import { assetSchema, cleanJson } from './shared.js'

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['Academic', 'General', 'Club', 'Important', 'Event'],
      required: true,
    },
    important: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    attachments: [assetSchema],
    status: { type: String, enum: NOTICE_STATUSES, default: 'pending' },
    publishedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true, toJSON: { transform: cleanJson } },
)

noticeSchema.index({ status: 1, publishedAt: -1 })
noticeSchema.index({ category: 1, status: 1 })
noticeSchema.index({ title: 'text', description: 'text' })

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema)
