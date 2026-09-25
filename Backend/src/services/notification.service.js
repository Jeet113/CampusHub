import Notification from '../models/Notification.js'
import ApiError from '../utils/ApiError.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'

export function createNotification(data, options = {}) {
  return Notification.create([{ ...data }], options).then(([notification]) => notification)
}

export async function listNotifications(userId, query) {
  const { page, limit, skip } = getPagination(query)
  const filter = { recipient: userId }
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ])
  return { items, pagination: paginationMeta(page, limit, total) }
}

export async function markNotificationRead(userId, id) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { read: true } },
    { new: true },
  )
  if (!notification) throw new ApiError(404, 'Notification not found')
  return notification
}

export async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } })
  return { updated: result.modifiedCount }
}
