import mongoose from 'mongoose'
import { EVENT_STATUSES } from '../constants/statuses.js'
import { assetSchema, cleanJson } from './shared.js'

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    organizer: { type: String, required: true, trim: true, maxlength: 150 },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, maxlength: 250 },
    banner: assetSchema,
    capacity: { type: Number, min: 1, default: null },
    registrationCount: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true, toJSON: { transform: cleanJson } },
)

eventSchema.index({ status: 1, date: 1 })
eventSchema.index({ category: 1, status: 1 })
eventSchema.index({ club: 1, date: 1 })
eventSchema.index({ title: 'text', organizer: 'text', description: 'text' })

export default mongoose.models.Event || mongoose.model('Event', eventSchema)
