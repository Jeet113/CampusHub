import mongoose from 'mongoose'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import Membership from '../models/Membership.js'
import Notice from '../models/Notice.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { makeSlug } from '../utils/slug.js'
import { createNotification } from './notification.service.js'

const modelConfig = {
  club: { Model: Club, approved: 'approved', pending: 'pending', rejected: 'rejected' },
  event: { Model: Event, approved: 'published', pending: 'pending', rejected: 'rejected' },
  notice: { Model: Notice, approved: 'published', pending: 'pending', rejected: 'rejected' },
}

export async function getMetrics() {
  const [users, activeUsers, clubs, approvedClubs, events, publishedEvents, registrations, notices] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    Club.countDocuments(),
    Club.countDocuments({ status: 'approved' }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    EventRegistration.countDocuments({ status: { $in: ['registered', 'attended'] } }),
    Notice.countDocuments({ status: 'published' }),
  ])
  return { users, activeUsers, clubs, approvedClubs, events, publishedEvents, registrations, publishedNotices: notices }
}

export async function getApprovals() {
  const [clubs, events, notices] = await Promise.all([
    Club.find({ status: 'pending' }).populate('createdBy', 'name email').sort({ createdAt: 1 }),
    Event.find({ status: 'pending' }).populate('club', 'name slug').sort({ createdAt: 1 }),
    Notice.find({ status: 'pending' }).populate('author', 'name email').sort({ createdAt: 1 }),
  ])
  return { clubs, events, notices }
}

export async function resolveApproval(id, type, decision, admin, reason) {
  const config = modelConfig[type]
  const resource = await config.Model.findOne({ _id: id, status: config.pending })
  if (!resource) throw new ApiError(404, `Pending ${type} not found`)
  const approved = decision === 'approve'
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      resource.status = approved ? config.approved : config.rejected
      if (approved && type === 'club') {
        resource.verifiedBy = admin._id
        resource.verifiedAt = new Date()
      }
      if (approved && type === 'event') {
        resource.approvedBy = admin._id
        resource.approvedAt = new Date()
      }
      if (approved && type === 'notice') resource.publishedAt = new Date()
      await resource.save({ session })

      const recipient = type === 'notice' ? resource.author : resource.createdBy
      if (recipient) {
        await createNotification(
          {
            recipient,
            type: 'admin_action',
            title: `${type[0].toUpperCase() + type.slice(1)} ${approved ? 'approved' : 'rejected'}`,
            message: reason || `Your ${type} submission was ${approved ? 'approved' : 'rejected'}`,
          },
          { session },
        )
      }
    })
  } finally {
    await session.endSession()
  }
  return resource
}

export async function setUserStatus(id, status, admin) {
  if (String(id) === String(admin._id) && status === 'suspended') throw new ApiError(400, 'You cannot suspend your own account')
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { status }, ...(status === 'suspended' ? { $unset: { refreshTokenHash: 1 } } : {}) },
    { new: true, runValidators: true },
  )
  if (!user) throw new ApiError(404, 'User not found')
  await createNotification({
    recipient: user._id,
    type: 'admin_action',
    title: `Account ${status}`,
    message: `Your CampusHub account is now ${status}`,
  })
  return user
}

export async function setClubStatus(id, status, admin) {
  const updates = { status }
  if (status === 'approved') Object.assign(updates, { verifiedBy: admin._id, verifiedAt: new Date() })
  const change = { $set: updates }
  if (status !== 'approved') change.$unset = { verifiedBy: 1, verifiedAt: 1 }
  const club = await Club.findByIdAndUpdate(id, change, { new: true, runValidators: true })
  if (!club) throw new ApiError(404, 'Club not found')
  await createNotification({
    recipient: club.createdBy,
    type: 'admin_action',
    title: `Club ${status}`,
    message: `${club.name} is now ${status}`,
  })
  return club
}

export async function setEventStatus(id, status, admin) {
  const updates = { status }
  if (status === 'published') Object.assign(updates, { approvedBy: admin._id, approvedAt: new Date() })
  const change = { $set: updates }
  if (status !== 'published') change.$unset = { approvedBy: 1, approvedAt: 1 }
  const event = await Event.findByIdAndUpdate(id, change, { new: true, runValidators: true })
  if (!event) throw new ApiError(404, 'Event not found')
  await createNotification({
    recipient: event.createdBy,
    type: 'admin_action',
    title: `Event ${status}`,
    message: `${event.title} is now ${status}`,
  })
  return event
}

export async function deleteUser(id, admin) {
  if (String(id) === String(admin._id)) throw new ApiError(400, 'You cannot delete your own account')
  const user = await User.findById(id)
  if (!user) throw new ApiError(404, 'User not found')
  if (user.club) throw new ApiError(409, 'Delete or transfer the associated club before deleting this account')

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const counts = await EventRegistration.aggregate([
        { $match: { student: user._id, status: 'registered' } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]).session(session)
      for (const item of counts) {
        await Event.updateOne(
          { _id: item._id },
          [{ $set: { registrationCount: { $max: [0, { $subtract: ['$registrationCount', item.count] }] } } }],
          { session },
        )
      }
      await Promise.all([
        EventRegistration.deleteMany({ student: user._id }, { session }),
        Membership.deleteMany({ user: user._id }, { session }),
        Notification.deleteMany({ recipient: user._id }, { session }),
        User.deleteOne({ _id: user._id }, { session }),
      ])
    })
  } finally {
    await session.endSession()
  }
}

async function availableClubSlug(name, session) {
  const base = makeSlug(name) || 'club'
  let slug = base
  let suffix = 1
  while (await Club.exists({ slug }).session(session || null)) slug = `${base}-${++suffix}`
  return slug
}

export async function seedClub(data, admin) {
  const email = data.email.toLowerCase().trim()
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists')
  if (await User.exists({ studentId: data.clubId })) throw new ApiError(409, 'Organization ID is already assigned to an account')

  let user
  let club
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      ;[user] = await User.create(
        [
          {
            name: data.name,
            email,
            password: data.password,
            role: 'club',
            studentId: data.clubId,
            department: 'Registered Organization',
            status: 'active',
          },
        ],
        { session },
      )
      const initials = data.initials || data.name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase()
      ;[club] = await Club.create(
        [
          {
            name: data.name,
            slug: await availableClubSlug(data.name, session),
            initials: initials || 'CL',
            category: data.category || 'Technology',
            description: data.description || `${data.name} campus organization.`,
            established: data.established,
            accent: data.accent || '#F59E0B',
            status: 'approved',
            createdBy: user._id,
            verifiedBy: admin._id,
            verifiedAt: new Date(),
          },
        ],
        { session },
      )
      user.club = club._id
      await user.save({ session })
    })
  } finally {
    await session.endSession()
  }
  return { user: user.toJSON(), club }
}

