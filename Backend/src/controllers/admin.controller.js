import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import {
  deleteUser,
  getApprovals,
  getMetrics,
  resolveApproval,
  seedClub as seedClubService,
  setClubStatus,
  setEventStatus,
  setUserStatus,
} from '../services/admin.service.js'

export async function metrics(_request, response) {
  return response.json(new ApiResponse(await getMetrics(), 'Admin metrics retrieved'))
}

export async function approvals(_request, response) {
  return response.json(new ApiResponse(await getApprovals(), 'Approval queue retrieved'))
}

async function decide(request, response, decision) {
  const { type, reason } = input(request, 'body')
  const resource = await resolveApproval(input(request, 'params').id, type, decision, request.user, reason)
  return response.json(new ApiResponse(resource, `${type} ${decision === 'approve' ? 'approved' : 'rejected'}`))
}

export const approve = (request, response) => decide(request, response, 'approve')
export const reject = (request, response) => decide(request, response, 'reject')

export async function updateUserStatus(request, response) {
  return response.json(
    new ApiResponse(
      await setUserStatus(input(request, 'params').id, input(request, 'body').status, request.user),
      'User status updated',
    ),
  )
}

export async function updateClubStatus(request, response) {
  return response.json(
    new ApiResponse(
      await setClubStatus(input(request, 'params').id, input(request, 'body').status, request.user),
      'Club status updated',
    ),
  )
}

export async function updateEventStatus(request, response) {
  return response.json(
    new ApiResponse(
      await setEventStatus(input(request, 'params').id, input(request, 'body').status, request.user),
      'Event status updated',
    ),
  )
}

export async function removeUser(request, response) {
  await deleteUser(input(request, 'params').id, request.user)
  return response.json(new ApiResponse(null, 'User deleted'))
}

export async function seedClub(request, response) {
  const result = await seedClubService(input(request, 'body'), request.user)
  return response.status(201).json(new ApiResponse(result, 'Club created successfully with login credentials'))
}

