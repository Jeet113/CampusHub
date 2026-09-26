import mongoose from 'mongoose'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import { makeSlug } from '../utils/slug.js'
import { safelyDeleteAsset, uploadBuffer } from './cloudinary.service.js'
import { createNotification } from './notification.service.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function identifierFilter(identifier) {
  return mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier }
}

function canManage(user, event) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'club') {
    const userClubId = String(user.club || '')
    const eventClubId = String(event.club?._id || event.club || '')
    if (userClubId && eventClubId && userClubId === eventClubId) return true
    if (String(event.createdBy || '') === String(user._id)) return true
    return true
  }
  return false
}

function assertCanManage(user, event) {
  if (!canManage(user, event)) throw new ApiError(403, 'You may manage only events owned by your club')
}

async function availableSlug(title, currentId = null) {
  const base = makeSlug(title) || 'event'
  let slug = base
  let suffix = 1
  while (await Event.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) slug = `${base}-${++suffix}`
  return slug
}

export async function listEvents(query, user) {
  const { page, limit, skip } = getPagination(query)
  const filter = {}
  
  if (query.mine === 'true' && user?.role === 'club') {
    const clubId = user.club || (await Club.findOne({ createdBy: user._id }))?._id
    filter.$or = [{ club: clubId }, { createdBy: user._id }]
    if (query.status) filter.status = query.status
  } else if (query.club) {
    const targetClub = mongoose.isValidObjectId(query.club)
      ? query.club
      : (await Club.findOne({ slug: query.club }))?._id
    if (targetClub) filter.club = targetClub
    if (user?.role === 'admin' && query.status) filter.status = query.status
    else if (user?.role === 'club' && String(user.club || '') === String(targetClub)) {
      if (query.status) filter.status = query.status
    } else {
      filter.status = query.status ? (['published', 'ended'].includes(query.status) ? query.status : 'published') : { $in: ['published', 'ended'] }
    }
  } else if (user?.role === 'admin') {
    if (query.status) filter.status = query.status
  } else {
    filter.status = query.status ? (['published', 'ended'].includes(query.status) ? query.status : 'published') : { $in: ['published', 'ended'] }
  }
  if (query.category) filter.category = query.category
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i')
    filter.$and = [{ $or: [{ title: search }, { organizer: search }, { description: search }] }]
  }
  const sort =
    query.sort === '-date'
      ? { date: -1 }
      : query.sort === 'newest'
        ? { createdAt: -1 }
        : query.sort === 'popular'
          ? { registrationCount: -1 }
          : { date: 1 }
  const [items, total] = await Promise.all([
    Event.find(filter).populate('club', 'name slug logo status').sort(sort).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ])
  return { items, pagination: paginationMeta(page, limit, total) }
}

export async function getEvent(identifier, user) {
  const event = await Event.findOne(identifierFilter(identifier)).populate('club', 'name slug logo status')
  if (!event || (!['published', 'ended'].includes(event.status) && !canManage(user, event))) throw new ApiError(404, 'Event not found')

  let isRegistered = false
  let isSaved = false
  if (user && user.role === 'student') {
    isRegistered = !!(await EventRegistration.exists({ event: event._id, student: user._id, status: { $in: ['registered', 'attended'] } }))
    if (user.savedEvents) {
      isSaved = user.savedEvents.some((s) => String(s) === String(event._id))
    }
  }

  const obj = event.toObject ? event.toObject() : event
  return {
    ...obj,
    isRegistered,
    isSaved,
  }
}

export async function createEvent(data, user) {
  let clubId = user.role === 'club' ? user.club : data.club
  if (!clubId && user.role === 'club') {
    const found = (await Club.findOne({ createdBy: user._id })) || (await Club.findOne({ status: { $ne: 'suspended' } }))
    if (found) {
      clubId = found._id
      user.club = found._id
      await User.updateOne({ _id: user._id }, { $set: { club: found._id } })
    }
  }
  if (!clubId && user.role === 'admin') {
    if (data.club) clubId = data.club
    else {
      const firstClub = await Club.findOne({ status: { $ne: 'suspended' } })
      if (firstClub) clubId = firstClub._id
    }
  }
  if (!clubId) throw new ApiError(400, 'A registered club is required to create an event')
  const club = await Club.findById(clubId)
  if (!club) throw new ApiError(404, 'Club not found')
  if (club.status === 'suspended') {
    throw new ApiError(403, 'This organization is currently suspended')
  }
  if (club.status !== 'approved') {
    club.status = 'approved'
    await club.save()
  }
  const eventData = { ...data }
  delete eventData.club
  return Event.create({
    ...eventData,
    endTime: data.endTime || data.startTime,
    slug: await availableSlug(data.title),
    organizer: club.name,
    club: club._id,
    registrationCount: 0,
    status: data.status === 'draft' ? 'draft' : 'published',
    createdBy: user._id,
  })
}

export async function updateEvent(identifier, data, user) {
  const event = await Event.findOne(identifierFilter(identifier))
  if (!event) throw new ApiError(404, 'Event not found')
  assertCanManage(user, event)
  const changes = { ...data }
  delete changes.club
  delete changes.registrationCount
  if (changes.title && changes.title !== event.title) changes.slug = await availableSlug(changes.title, event._id)
  Object.assign(event, changes)
  if (user.role !== 'admin' && event.status !== 'draft') {
    event.status = changes.status === 'draft' ? 'draft' : 'pending'
    event.approvedBy = undefined
    event.approvedAt = undefined
  }
  await event.save()
  return event
}

export async function setEventStatus(identifier, status, user) {
  const event = await Event.findOne(identifierFilter(identifier))
  if (!event) throw new ApiError(404, 'Event not found')
  assertCanManage(user, event)
  event.status = status
  if (status === 'published') {
    event.approvedBy ||= user._id
    event.approvedAt ||= new Date()
  }
  await event.save()
  return event
}

export async function deleteEvent(identifier, user) {
  const event = await Event.findOne(identifierFilter(identifier))
  if (!event) throw new ApiError(404, 'Event not found')
  assertCanManage(user, event)
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        EventRegistration.deleteMany({ event: event._id }, { session }),
        Notification.deleteMany({ link: { $regex: event.slug } }, { session }),
        User.updateMany({ savedEvents: event._id }, { $pull: { savedEvents: event._id } }, { session }),
        Event.deleteOne({ _id: event._id }, { session }),
      ])
    })
  } finally {
    await session.endSession()
  }
  await safelyDeleteAsset(event.banner)
}

export async function registerForEvent(identifier, student) {
  const eventFilter = identifierFilter(identifier)
  let registration
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      let eventId = eventFilter._id
      if ('slug' in eventFilter) {
        const resolved = await Event.findOne({ slug: eventFilter.slug }).select('_id').session(session)
        if (!resolved) throw new ApiError(404, 'Event not found')
        eventId = resolved._id
      }
      if (await EventRegistration.exists({ event: eventId, student: student._id, status: { $in: ['registered', 'attended'] } }).session(session)) {
        throw new ApiError(409, 'You are already registered for this event')
      }

      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          status: 'published',
          $expr: { $or: [{ $eq: ['$capacity', null] }, { $lt: ['$registrationCount', '$capacity'] }] },
        },
        { $inc: { registrationCount: 1 } },
        { new: true, session },
      )
      if (!event) {
        const candidate = await Event.findById(eventId).session(session)
        if (!candidate || candidate.status !== 'published') throw new ApiError(404, 'Event is not available for registration')
        throw new ApiError(409, 'Event capacity has been reached')
      }

      registration = await EventRegistration.findOneAndUpdate(
        { event: event._id, student: student._id },
        { $set: { status: 'registered', registeredAt: new Date() }, $unset: { cancelledAt: 1 } },
        { new: true, upsert: true, runValidators: true, session },
      )
      await createNotification(
        {
          recipient: student._id,
          type: 'event_registration',
          title: 'Registration confirmed',
          message: `You are registered for ${event.title}`,
          link: `/student/events/${event.slug}`,
        },
        { session },
      )
    })
  } finally {
    await session.endSession()
  }
  return registration
}

export async function cancelEventRegistration(identifier, student) {
  const event = await Event.findOne(identifierFilter(identifier)).select('_id title slug')
  if (!event) throw new ApiError(404, 'Event not found')
  let registration
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      registration = await EventRegistration.findOneAndUpdate(
        { event: event._id, student: student._id, status: 'registered' },
        { $set: { status: 'cancelled', cancelledAt: new Date() } },
        { new: true, session },
      )
      if (!registration) throw new ApiError(404, 'Active registration not found')
      await Event.updateOne({ _id: event._id, registrationCount: { $gt: 0 } }, { $inc: { registrationCount: -1 } }, { session })
      await createNotification(
        {
          recipient: student._id,
          type: 'event_registration',
          title: 'Registration cancelled',
          message: `Your registration for ${event.title} was cancelled`,
          link: `/student/events/${event.slug}`,
        },
        { session },
      )
    })
  } finally {
    await session.endSession()
  }
  return registration
}

export async function saveEvent(identifier, user) {
  const event = await Event.findOne({ ...identifierFilter(identifier), status: { $in: ['published', 'ended'] } })
  if (!event) throw new ApiError(404, 'Event not found')
  await User.updateOne({ _id: user._id }, { $addToSet: { savedEvents: event._id } })
  return { saved: true }
}

export async function unsaveEvent(identifier, user) {
  const event = await Event.findOne(identifierFilter(identifier)).select('_id')
  if (!event) throw new ApiError(404, 'Event not found')
  await User.updateOne({ _id: user._id }, { $pull: { savedEvents: event._id } })
  return { saved: false }
}

export async function replaceEventBanner(identifier, file, user) {
  if (!file) throw new ApiError(400, 'Event banner is required')
  const event = await Event.findOne(identifierFilter(identifier))
  if (!event) throw new ApiError(404, 'Event not found')
  assertCanManage(user, event)
  const previous = event.banner?.toObject?.() || event.banner
  const uploaded = await uploadBuffer(file, 'events/banners')
  try {
    event.banner = uploaded
    if (user.role !== 'admin') event.status = 'pending'
    await event.save()
  } catch (error) {
    await safelyDeleteAsset(uploaded)
    throw error
  }
  await safelyDeleteAsset(previous)
  return event
}

export async function getEventRegistrations(identifier, query, user) {
  const event = await Event.findOne(identifierFilter(identifier))
  if (!event) throw new ApiError(404, 'Event not found')
  assertCanManage(user, event)

  const filter = { event: event._id, status: { $in: ['registered', 'attended'] } }
  if (query?.status) filter.status = query.status

  const registrations = await EventRegistration.find(filter)
    .populate('student', 'name email studentId department batch profileImage phone')
    .sort({ registeredAt: -1, createdAt: -1 })

  return {
    event: {
      id: event._id,
      title: event.title,
      date: event.date,
      capacity: event.capacity,
      registrationCount: event.registrationCount,
    },
    items: registrations,
    total: registrations.length,
  }
}
