import mongoose from 'mongoose'
import Notice from '../models/Notice.js'
import Club from '../models/Club.js'
import ApiError from '../utils/ApiError.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import { safelyDeleteAsset, uploadBuffer } from './cloudinary.service.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function canManage(user, notice) {
  return user?.role === 'admin' || String(notice.author) === String(user?._id)
}

function assertCanManage(user, notice) {
  if (!canManage(user, notice)) throw new ApiError(403, 'You may manage only notices created by your club')
}

export async function listNotices(query, user) {
  const { page, limit, skip } = getPagination(query)
  const filter = {}
  if (user?.role === 'admin' && query.status) filter.status = query.status
  else if (user?.role === 'club' && query.status) filter.$or = [{ status: 'published' }, { author: user._id }]
  else {
    filter.status = 'published'
    filter.$or = [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }]
  }
  if (query.category) filter.category = query.category
  if (typeof query.important === 'boolean') filter.important = query.important
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i')
    filter.$and = [{ $or: [{ title: search }, { description: search }] }]
  }
  const [items, total] = await Promise.all([
    Notice.find(filter).populate('author', 'name role').populate('club', 'name slug').sort({ important: -1, publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Notice.countDocuments(filter),
  ])
  return { items, pagination: paginationMeta(page, limit, total) }
}

export async function getNotice(id, user) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid notice id')
  const notice = await Notice.findById(id).populate('author', 'name role').populate('club', 'name slug')
  if (!notice || (notice.status !== 'published' && !canManage(user, notice))) throw new ApiError(404, 'Notice not found')
  return notice
}

export async function createNotice(data, user) {
  const isAdmin = user.role === 'admin'
  const clubId = user.club || (await Club.findOne({ createdBy: user._id }))?._id
  return Notice.create({
    ...data,
    author: user._id,
    club: isAdmin ? undefined : clubId,
    status: data.status === 'draft' ? 'draft' : 'published',
    publishedAt: data.status === 'draft' ? undefined : new Date(),
  })
}

export async function updateNotice(id, data, user) {
  const notice = await Notice.findById(id)
  if (!notice) throw new ApiError(404, 'Notice not found')
  assertCanManage(user, notice)
  Object.assign(notice, data)
  if (user.role === 'admin' && data.status !== 'draft') {
    notice.status = 'published'
    notice.publishedAt ||= new Date()
  } else if (user.role !== 'admin' && notice.status !== 'draft') {
    notice.status = 'pending'
    notice.publishedAt = undefined
  }
  await notice.save()
  return notice
}

export async function deleteNotice(id, user) {
  const notice = await Notice.findById(id)
  if (!notice) throw new ApiError(404, 'Notice not found')
  assertCanManage(user, notice)
  await notice.deleteOne()
  await Promise.all((notice.attachments || []).map(safelyDeleteAsset))
}

export async function addNoticeAttachments(id, files, user) {
  if (!files?.length) throw new ApiError(400, 'At least one attachment is required')
  const notice = await Notice.findById(id)
  if (!notice) throw new ApiError(404, 'Notice not found')
  assertCanManage(user, notice)
  if (notice.attachments.length + files.length > 5) throw new ApiError(400, 'A notice may have at most 5 attachments')

  const uploaded = []
  try {
    for (const file of files) uploaded.push(await uploadBuffer(file, 'notices/attachments'))
    notice.attachments.push(...uploaded)
    if (user.role !== 'admin' && notice.status !== 'draft') notice.status = 'pending'
    await notice.save()
  } catch (error) {
    await Promise.all(uploaded.map(safelyDeleteAsset))
    throw error
  }
  return notice
}
