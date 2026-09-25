import mongoose from 'mongoose'
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from '../constants/statuses.js'
import { cleanJson } from './shared.js'

const membershipSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBERSHIP_ROLES, default: 'member' },
    status: { type: String, enum: MEMBERSHIP_STATUSES, default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    joinedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true, toJSON: { transform: cleanJson } },
)

membershipSchema.index(
  { club: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
    name: 'one_active_membership_per_club_user',
  },
)
membershipSchema.index({ user: 1, status: 1 })

export default mongoose.models.Membership || mongoose.model('Membership', membershipSchema)
