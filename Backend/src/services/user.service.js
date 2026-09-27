import User from '../models/User.js'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import Membership from '../models/Membership.js'
import Notice from '../models/Notice.js'
import Notification from '../models/Notification.js'
import ApiError from '../utils/ApiError.js'
import { uploadBuffer, safelyDeleteAsset } from './cloudinary.service.js'

export async function getProfile(userId) {
  const user = await User.findById(userId).populate('club', 'name slug status logo')
  if (!user) throw new ApiError(404, 'User not found')
  if (user.role === 'admin' && !user.profileImage?.url) {
    user.profileImage = { url: '/admin-avatar.png' }
  }
  return user
}

export async function updateProfile(userId, data) {
  const allowed = ['name', 'department', 'batch', 'phone', 'bio']
  const changes = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)))
  for (const [key, value] of Object.entries(data.notificationPreferences || {})) {
    changes[`notificationPreferences.${key}`] = value
  }
  const user = await User.findByIdAndUpdate(userId, { $set: changes }, { new: true, runValidators: true })
  if (!user) throw new ApiError(404, 'User not found')
  return user
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password +refreshTokenHash')
  if (!user || !(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect')
  if (await user.comparePassword(newPassword)) throw new ApiError(400, 'New password must be different')
  user.password = newPassword
  user.refreshTokenHash = undefined
  await user.save()
}

export async function replaceAvatar(userId, file) {
  if (!file) throw new ApiError(400, 'Avatar image is required')
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  const previous = user.profileImage?.toObject?.() || user.profileImage
  const uploaded = await uploadBuffer(file, 'profiles')
  try {
    user.profileImage = uploaded
    await user.save()
  } catch (error) {
    await safelyDeleteAsset(uploaded)
    throw error
  }
  await safelyDeleteAsset(previous)
  return user
}

export async function getStudentDashboard(userId) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')

  const [
    eventsCount,
    clubsCount,
    noticesCount,
    unreadNotifsCount,
    registeredCount,
    joinedClubsCount,
    recentNotices,
    recommendedClubs,
    studentRegistrations,
    upcomingCampusEvents,
  ] = await Promise.all([
    Event.countDocuments({ status: { $in: ['published', 'ended'] } }),
    Club.countDocuments({ status: { $ne: 'suspended' } }),
    Notice.countDocuments({ status: 'published' }),
    Notification.countDocuments({ recipient: userId, read: false }),
    EventRegistration.countDocuments({ student: userId, status: { $in: ['registered', 'attended'] } }),
    Membership.countDocuments({ user: userId, status: 'approved' }),
    Notice.find({ status: 'published' })
      .populate('author', 'name role')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3),
    Club.find({ status: { $ne: 'suspended' } })
      .select('name slug initials category description logo accent memberCount banner')
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(4),
    EventRegistration.find({ student: userId, status: { $in: ['registered', 'attended'] } })
      .populate({
        path: 'event',
        populate: { path: 'club', select: 'name slug logo status' },
      })
      .sort({ createdAt: -1 })
      .limit(5),
    Event.find({ status: 'published' })
      .populate('club', 'name slug logo status')
      .sort({ date: 1, startTime: 1 })
      .limit(5),
  ])

  let featuredEvent = null
  let isRegistered = false
  let badge = 'Featured event'

  const validRegisteredEvents = studentRegistrations
    .map((r) => r.event)
    .filter((e) => e && ['published', 'ended'].includes(e.status))

  if (validRegisteredEvents.length > 0) {
    featuredEvent = validRegisteredEvents[0]
    isRegistered = true
    badge = 'Your registered event'
  } else if (upcomingCampusEvents.length > 0) {
    featuredEvent = upcomingCampusEvents[0]
    isRegistered = false
    badge = 'Upcoming event'
  }

  const featuredObj = featuredEvent
    ? {
        ...(featuredEvent.toObject ? featuredEvent.toObject() : featuredEvent),
        isRegistered,
        badge,
      }
    : null

  return {
    stats: {
      upcomingEvents: eventsCount,
      clubs: clubsCount,
      notices: noticesCount,
      unreadNotifications: unreadNotifsCount,
      registeredEvents: registeredCount,
      joinedClubs: joinedClubsCount,
      savedEvents: user.savedEvents?.length || 0,
    },
    featuredEvent: featuredObj,
    notices: recentNotices,
    clubs: recommendedClubs,
    events: upcomingCampusEvents,
  }
}

