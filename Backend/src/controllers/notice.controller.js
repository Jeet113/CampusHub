import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import {
  addNoticeAttachments,
  createNotice,
  deleteNotice,
  getNotice,
  listNotices,
  updateNotice,
} from '../services/notice.service.js'

export async function list(request, response) {
  const result = await listNotices(input(request, 'query'), request.user)
  return response.json(new ApiResponse(result.items, 'Notices retrieved', { pagination: result.pagination }))
}

export async function getOne(request, response) {
  return response.json(new ApiResponse(await getNotice(input(request, 'params').id, request.user), 'Notice retrieved'))
}

export async function create(request, response) {
  return response.status(201).json(
    new ApiResponse(await createNotice(input(request, 'body'), request.user), 'Notice created'),
  )
}

export async function update(request, response) {
  return response.json(
    new ApiResponse(await updateNotice(input(request, 'params').id, input(request, 'body'), request.user), 'Notice updated'),
  )
}

export async function remove(request, response) {
  await deleteNotice(input(request, 'params').id, request.user)
  return response.json(new ApiResponse(null, 'Notice deleted'))
}

export async function uploadAttachments(request, response) {
  return response.json(
    new ApiResponse(
      await addNoticeAttachments(input(request, 'params').id, request.files, request.user),
      'Notice attachments uploaded',
    ),
  )
}
