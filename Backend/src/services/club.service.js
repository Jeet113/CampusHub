import mongoose from 'mongoose'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import Membership from '../models/Membership.js'
import Notice from '../models/Notice.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import { makeSlug } from '../utils/slug.js'
import { createNotification } from './notification.service.js'
import { safelyDeleteAsset, uploadBuffer } from './cloudinary.service.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function identifierFilter(identifier, user) {
  if (identifier === 'mine' && user) {
    return user.club ? { _id: user.club } : { createdBy: user._id }
  }
  return mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier }
}

function canManage(user, club) {
  return user?.role === 'admin' || String(user?.club || '') === String(club._id) || String(club.createdBy) === String(user?._id)
}

function assertCanManage(user, club) {
  if (!canManage(user, club)) throw new ApiError(403, 'You may manage only your own club')
}

export async function getClubDashboard(identifier, user) {
  const filter = identifierFilter(identifier, user)
  const club = await Club.findOne(filter).populate('createdBy', 'name email')
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalMembers,
    events,
    totalNotices,
    recentMembers,
    recentNotices,
  ] = await Promise.all([
    Membership.countDocuments({ club: club._id, status: 'approved' }),
    Event.find({ club: club._id }).sort({ date: -1 }),
    Notice.countDocuments({ $or: [{ club: club._id }, { author: user._id }] }),
    Membership.find({ club: club._id, status: 'approved' })
      .populate('user', 'name email studentId department profileImage status')
      .sort({ createdAt: -1 })
      .limit(6),
    Notice.find({ $or: [{ club: club._id }, { author: user._id }] })
      .sort({ createdAt: -1 })
      .limit(5),
  ])

  const upcomingEvents = events.filter((e) => new Date(e.date) >= todayStart && e.status !== 'ended').length
  const publishedEvents = events.filter((e) => e.status === 'published' && new Date(e.date) >= todayStart).length
  const endedEvents = events.filter((e) => e.status === 'ended' || new Date(e.date) < todayStart).length
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0)

  return {
    club,
    metrics: {
      totalMembers,
      upcomingEvents,
      publishedEvents,
      endedEvents,
      totalEvents: events.length,
      totalRegistrations,
      totalNotices,
    },
    events: events.slice(0, 10),
    recentMembers: recentMembers.map((m) => ({
      _id: m._id,
      id: m._id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt || m.createdAt,
      user: m.user,
    })),
    recentNotices: recentNotices.map((n) => ({
      _id: n._id,
      id: n._id,
      title: n.title,
      description: n.description,
      category: n.category,
      status: n.status,
      important: n.important,
      publishedAt: n.publishedAt || n.createdAt,
      createdAt: n.createdAt,
    })),
  }
}

async function availableSlug(name, currentId = null) {
  const base = makeSlug(name) || 'club'
  let slug = base
  let suffix = 1
  while (await Club.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) slug = `${base}-${++suffix}`
  return slug
}

export async function listClubs(query, user) {
  const { page, limit, skip } = getPagination(query)
  const filter = {}
  const privileged = user?.role === 'admin'
  if (privileged) {
    if (query.status) filter.status = query.status
  } else if (user?.role === 'club' && query.status) {
    filter.$or = [{ status: { $ne: 'suspended' } }, { _id: user.club }]
  } else {
    filter.status = { $ne: 'suspended' }
  }
  if (query.category) filter.category = query.category
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i')
    filter.$and = [{ $or: [{ name: search }, { description: search }, { category: search }] }]
  }
  const sort = query.sort === 'name' ? { name: 1 } : query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }
  const [items, total] = await Promise.all([
    Club.find(filter).populate('createdBy', 'name').sort(sort).skip(skip).limit(limit),
    Club.countDocuments(filter),
  ])
  return { items, pagination: paginationMeta(page, limit, total) }
}

export async function getClub(identifier, user) {
  const club = await Club.findOne(identifierFilter(identifier)).populate('createdBy', 'name email')
  if (!club || (club.status === 'suspended' && !canManage(user, club))) throw new ApiError(404, 'Club not found')
  return club
}

export async function createClub(data, user) {
  if (user.role === 'club' && user.club) throw new ApiError(409, 'This account is already associated with a club')
  const payload = { ...data, slug: await availableSlug(data.name), status: 'pending', createdBy: user._id }
  if (user.role === 'admin') return Club.create(payload)

  let club
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      ;[club] = await Club.create([payload], { session })
      user.club = club._id
      await user.save({ session })
    })
  } finally {
    await session.endSession()
  }
  return club
}

export async function updateClub(identifier, data, user) {
  const club = await Club.findOne(identifierFilter(identifier, user))
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)
  const changes = { ...data }
  if (changes.name && changes.name !== club.name) changes.slug = await availableSlug(changes.name, club._id)
  delete changes.status
  Object.assign(club, changes)
  if (user.role !== 'admin' && club.isModified() && club.status !== 'approved') {
    club.status = 'pending'
    club.verifiedBy = undefined
    club.verifiedAt = undefined
  }
  await club.save()
  return club
}

export async function deleteClub(identifier, user) {
  const club = await Club.findOne(identifierFilter(identifier))
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)
  const eventIds = await Event.find({ club: club._id }).distinct('_id')
  const events = await Event.find({ club: club._id }).select('banner')
  const notices = await Notice.find({ club: club._id }).select('attachments')
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        EventRegistration.deleteMany({ event: { $in: eventIds } }, { session }),
        Event.deleteMany({ club: club._id }, { session }),
        Membership.deleteMany({ club: club._id }, { session }),
        Notice.deleteMany({ club: club._id }, { session }),
        User.updateMany({ club: club._id }, { $unset: { club: 1 } }, { session }),
        Club.deleteOne({ _id: club._id }, { session }),
      ])
    })
  } finally {
    await session.endSession()
  }
  await Promise.all([
    safelyDeleteAsset(club.logo),
    safelyDeleteAsset(club.banner),
    ...events.map((e) => safelyDeleteAsset(e.banner)),
    ...notices.flatMap((n) => (n.attachments || []).map(safelyDeleteAsset)),
  ])
}

export async function joinClub(identifier, user) {
  const club = await Club.findOne({ ...identifierFilter(identifier), status: { $ne: 'suspended' } })
  if (!club) throw new ApiError(404, 'Club not found')
  const active = await Membership.findOne({ club: club._id, user: user._id, status: 'approved' })
  if (active) throw new ApiError(409, 'You are already a member of this club')

  let membership
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      membership = await Membership.findOneAndUpdate(
        { club: club._id, user: user._id },
        {
          $set: {
            role: 'member',
            status: 'approved',
            joinedAt: new Date(),
            approvedAt: new Date(),
          },
        },
        { upsert: true, new: true, session },
      )

      await Club.updateOne({ _id: club._id }, { $inc: { memberCount: 1 } }, { session })

      if (club.createdBy) {
        await createNotification(
          {
            recipient: club.createdBy,
            type: 'club_membership',
            title: 'New Member Joined',
            message: `${user.name} joined ${club.name}`,
            link: `/club/members`,
          },
          { session },
        )
      }

      await createNotification(
        {
          recipient: user._id,
          type: 'club_membership',
          title: 'Club Joined',
          message: `You are now a member of ${club.name}`,
          link: `/student/clubs/${club.slug || club._id}`,
        },
        { session },
      )
    })
  } finally {
    await session.endSession()
  }
  return membership
}

export async function listMembers(identifier, user, query) {
  const club = await Club.findOne(identifierFilter(identifier, user))
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)
  const { page, limit, skip } = getPagination(query)
  const filter = { club: club._id, ...(query.status ? { status: query.status } : {}) }
  const [items, total] = await Promise.all([
    Membership.find(filter).populate('user', 'name email studentId department profileImage status').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Membership.countDocuments(filter),
  ])
  return { items, pagination: paginationMeta(page, limit, total) }
}

export async function updateMember(identifier, membershipId, data, user) {
  const club = await Club.findOne(identifierFilter(identifier, user))
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)
  const membership = await Membership.findOne({ _id: membershipId, club: club._id })
  if (!membership) throw new ApiError(404, 'Membership not found')

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      if (data.role) membership.role = data.role
      if (data.status) {
        membership.status = data.status
        if (data.status === 'approved') {
          membership.approvedAt = new Date()
          membership.joinedAt ||= new Date()
        }
      }
      await membership.save({ session })
      await createNotification(
        {
          recipient: membership.user,
          type: 'club_membership',
          title: `Membership ${membership.status}`,
          message: `Your membership request for ${club.name} is ${membership.status}`,
          link: `/student/clubs/${club.slug}`,
        },
        { session },
      )
    })
  } finally {
    await session.endSession()
  }
  return membership
}

export function removeMember(identifier, membershipId, user) {
  return updateMember(identifier, membershipId, { status: 'removed' }, user)
}

export async function replaceClubAsset(identifier, kind, file, user) {
  if (!file) throw new ApiError(400, `${kind} image is required`)
  const club = await Club.findOne(identifierFilter(identifier, user))
  if (!club) throw new ApiError(404, 'Club not found')
  assertCanManage(user, club)
  const previous = club[kind]?.toObject?.() || club[kind]
  const uploaded = await uploadBuffer(file, `clubs/${kind}s`)
  try {
    club[kind] = uploaded
    await club.save()
    if (kind === 'logo') {
      if (club.createdBy) {
        await User.updateOne({ _id: club.createdBy }, { $set: { profileImage: uploaded } })
      }
      if (user?._id) {
        await User.updateOne({ _id: user._id }, { $set: { profileImage: uploaded } })
      }
    }
  } catch (error) {
    await safelyDeleteAsset(uploaded)
    throw error
  }
  await safelyDeleteAsset(previous)
  return club
}
