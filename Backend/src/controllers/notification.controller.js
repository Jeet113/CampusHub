import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service.js'

export async function list(request, response) {
  const result = await listNotifications(request.user._id, input(request, 'query'))
  return response.json(new ApiResponse(result.items, 'Notifications retrieved', { pagination: result.pagination }))
}

export async function markRead(request, response) {
  return response.json(
    new ApiResponse(await markNotificationRead(request.user._id, input(request, 'params').id), 'Notification marked read'),
  )
}

export async function markAllRead(request, response) {
  return response.json(
    new ApiResponse(await markAllNotificationsRead(request.user._id), 'All notifications marked read'),
  )
}
