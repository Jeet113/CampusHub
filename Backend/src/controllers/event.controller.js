import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import {
  cancelEventRegistration,
  createEvent,
  deleteEvent,
  getEvent,
  getEventRegistrations,
  getStudentRegisteredEvents,
  getStudentSavedEvents,
  listEvents,
  registerForEvent,
  replaceEventBanner,
  saveEvent,
  setEventStatus,
  unsaveEvent,
  updateEvent,
} from '../services/event.service.js'

export async function listMyRegistrations(request, response) {
  const result = await getStudentRegisteredEvents(request.user._id, input(request, 'query'))
  return response.json(new ApiResponse(result.items, 'Registered events retrieved', { pagination: result.pagination }))
}

export async function listMySaved(request, response) {
  const result = await getStudentSavedEvents(request.user._id, input(request, 'query'))
  return response.json(new ApiResponse(result.items, 'Saved events retrieved', { pagination: result.pagination }))
}

export async function listRegistrations(request, response) {
  const result = await getEventRegistrations(input(request, 'params').id, input(request, 'query'), request.user)
  return response.json(new ApiResponse(result, 'Event registrations retrieved'))
}

export async function list(request, response) {
  const result = await listEvents(input(request, 'query'), request.user)
  return response.json(new ApiResponse(result.items, 'Events retrieved', { pagination: result.pagination }))
}

export async function getOne(request, response) {
  return response.json(new ApiResponse(await getEvent(input(request, 'params').id, request.user), 'Event retrieved'))
}

export async function create(request, response) {
  return response.status(201).json(
    new ApiResponse(await createEvent(input(request, 'body'), request.user), 'Event submitted for approval'),
  )
}

export async function update(request, response) {
  return response.json(
    new ApiResponse(await updateEvent(input(request, 'params').id, input(request, 'body'), request.user), 'Event updated'),
  )
}

export async function updateStatus(request, response) {
  const { id } = input(request, 'params')
  const { status } = input(request, 'body')
  return response.json(
    new ApiResponse(await setEventStatus(id, status, request.user), 'Event status updated'),
  )
}

export async function remove(request, response) {
  await deleteEvent(input(request, 'params').id, request.user)
  return response.json(new ApiResponse(null, 'Event deleted'))
}

export async function register(request, response) {
  return response.status(201).json(
    new ApiResponse(await registerForEvent(input(request, 'params').id, request.user), 'Event registration confirmed'),
  )
}

export async function cancelRegistration(request, response) {
  return response.json(
    new ApiResponse(await cancelEventRegistration(input(request, 'params').id, request.user), 'Event registration cancelled'),
  )
}

export async function save(request, response) {
  return response.json(new ApiResponse(await saveEvent(input(request, 'params').id, request.user), 'Event saved'))
}

export async function unsave(request, response) {
  return response.json(new ApiResponse(await unsaveEvent(input(request, 'params').id, request.user), 'Event removed from saved'))
}

export async function uploadBanner(request, response) {
  const event = await replaceEventBanner(input(request, 'params').id, request.file, request.user)
  const asset = event.banner
  return response.json(
    new ApiResponse(event, 'Event banner updated', {
      imageUrl: asset?.imageUrl || asset?.url,
      cloudinaryPublicId: asset?.cloudinaryPublicId || asset?.publicId,
    }),
  )
}
