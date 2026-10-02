import mongoose from 'mongoose'
import { CLUB_STATUSES } from '../constants/statuses.js'
import { assetSchema, cleanJson } from './shared.js'

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    initials: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    mission: { type: String, trim: true, maxlength: 1000 },
    established: { type: Number, min: 1800, max: 2200 },
    logo: assetSchema,
    banner: assetSchema,
    accent: { type: String, trim: true, match: /^#[0-9A-Fa-f]{6}$/ },
    status: { type: String, enum: CLUB_STATUSES, default: 'pending' },
    interests: [{ type: String, trim: true }],
    activities: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    goals: [{ type: String, trim: true }],
    experienceLevel: [{ type: String, trim: true }],
    timeCommitment: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true, toJSON: { transform: cleanJson } },
)

clubSchema.index({ status: 1, category: 1 })
clubSchema.index({ name: 'text', description: 'text' })

export default mongoose.models.Club || mongoose.model('Club', clubSchema)
