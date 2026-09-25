import mongoose from 'mongoose'
import { REGISTRATION_STATUSES } from '../constants/statuses.js'
import { cleanJson } from './shared.js'

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'registered' },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: Date,
  },
  { timestamps: true, toJSON: { transform: cleanJson } },
)

eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true })
eventRegistrationSchema.index({ student: 1, status: 1 })

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema)
