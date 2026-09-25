import { Router } from 'express'
import * as controller from '../controllers/notice.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { attachmentUpload } from '../middleware/upload.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import { idParams } from '../validators/common.validator.js'
import { createNoticeSchema, noticeQuerySchema, updateNoticeSchema } from '../validators/notice.validator.js'

const router = Router()

router.get('/', optionalAuthenticate, validate({ query: noticeQuerySchema }), asyncHandler(controller.list))
router.post('/', authenticate, requireRole('club', 'admin'), validate({ body: createNoticeSchema }), asyncHandler(controller.create))
router.post(
  '/:id/attachments',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  attachmentUpload.array('attachments', 5),
  asyncHandler(controller.uploadAttachments),
)
router.get('/:id', optionalAuthenticate, validate({ params: idParams }), asyncHandler(controller.getOne))
router.put(
  '/:id',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams, body: updateNoticeSchema }),
  asyncHandler(controller.update),
)
router.delete(
  '/:id',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  asyncHandler(controller.remove),
)

export default router
