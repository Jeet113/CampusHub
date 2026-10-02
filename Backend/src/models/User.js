import mongoose from 'mongoose'
import { USER_ROLES } from '../constants/roles.js'
import { USER_STATUSES } from '../constants/statuses.js'
import { comparePassword, hashPassword } from '../utils/password.js'
import { assetSchema, cleanJson } from './shared.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, default: 'student', index: true },
    studentId: { type: String, trim: true, uppercase: true },
    department: { type: String, trim: true, maxlength: 120 },
    batch: { type: String, trim: true, maxlength: 30 },
    profileImage: assetSchema,
    phone: { type: String, trim: true, maxlength: 30 },
    bio: { type: String, trim: true, maxlength: 500 },
    interests: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    goals: [{ type: String, trim: true }],
    status: { type: String, enum: USER_STATUSES, default: 'active', index: true },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      clubUpdates: { type: Boolean, default: true },
    },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    refreshTokenHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true, toJSON: { transform: cleanJson }, toObject: { transform: cleanJson } },
)

userSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $type: 'string' } } },
)

userSchema.pre('save', async function hashChangedPassword() {
  if (this.isModified('password')) this.password = await hashPassword(this.password)
})

userSchema.methods.comparePassword = function verifyPassword(candidate) {
  return comparePassword(candidate, this.password)
}

export default mongoose.models.User || mongoose.model('User', userSchema)
