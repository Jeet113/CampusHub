import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import {
  createClub,
  deleteClub,
  getClub,
  joinClub,
  listClubs,
  listMembers,
  removeMember,
  replaceClubAsset,
  updateClub,
  updateMember,
} from '../services/club.service.js'

export async function list(request, response) {
  const result = await listClubs(input(request, 'query'), request.user)
  return response.json(new ApiResponse(result.items, 'Clubs retrieved', { pagination: result.pagination }))
}

export async function getOne(request, response) {
  return response.json(new ApiResponse(await getClub(input(request, 'params').id, request.user), 'Club retrieved'))
}

export async function create(request, response) {
  return response.status(201).json(new ApiResponse(await createClub(input(request, 'body'), request.user), 'Club submitted for approval'))
}

export async function update(request, response) {
  return response.json(
    new ApiResponse(await updateClub(input(request, 'params').id, input(request, 'body'), request.user), 'Club updated'),
  )
}

export async function remove(request, response) {
  await deleteClub(input(request, 'params').id, request.user)
  return response.json(new ApiResponse(null, 'Club deleted'))
}

export async function join(request, response) {
  return response.status(201).json(
    new ApiResponse(await joinClub(input(request, 'params').id, request.user), 'Membership request submitted'),
  )
}

export async function members(request, response) {
  const result = await listMembers(input(request, 'params').id, request.user, input(request, 'query'))
  return response.json(new ApiResponse(result.items, 'Members retrieved', { pagination: result.pagination }))
}

export async function patchMember(request, response) {
  const params = input(request, 'params')
  return response.json(
    new ApiResponse(await updateMember(params.id, params.memberId, input(request, 'body'), request.user), 'Membership updated'),
  )
}

export async function deleteMember(request, response) {
  const params = input(request, 'params')
  return response.json(new ApiResponse(await removeMember(params.id, params.memberId, request.user), 'Member removed'))
}

export async function uploadLogo(request, response) {
  return response.json(
    new ApiResponse(await replaceClubAsset(input(request, 'params').id, 'logo', request.file, request.user), 'Club logo updated'),
  )
}

export async function uploadBanner(request, response) {
  return response.json(
    new ApiResponse(await replaceClubAsset(input(request, 'params').id, 'banner', request.file, request.user), 'Club banner updated'),
  )
}
