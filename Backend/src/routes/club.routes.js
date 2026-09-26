import { Router } from 'express'
import * as controller from '../controllers/club.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { singleImageUpload } from '../middleware/upload.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  clubQuerySchema,
  createClubSchema,
  memberQuerySchema,
  updateClubSchema,
  updateMemberSchema,
} from '../validators/club.validator.js'
import { idParams, memberParams } from '../validators/common.validator.js'

const router = Router()

router.get('/', optionalAuthenticate, validate({ query: clubQuerySchema }), asyncHandler(controller.list))
router.post('/', authenticate, requireRole('club', 'admin'), validate({ body: createClubSchema }), asyncHandler(controller.create))
router.get(
  '/:id/dashboard',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  asyncHandler(controller.dashboard),
)
router.post('/:id/join', authenticate, requireRole('student'), validate({ params: idParams }), asyncHandler(controller.join))
router.get(
  '/:id/members',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams, query: memberQuerySchema }),
  asyncHandler(controller.members),
)
router.patch(
  '/:id/members/:memberId',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: memberParams, body: updateMemberSchema }),
  asyncHandler(controller.patchMember),
)
router.delete(
  '/:id/members/:memberId',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: memberParams }),
  asyncHandler(controller.deleteMember),
)
router.post(
  '/:id/logo',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  singleImageUpload('logo'),
  asyncHandler(controller.uploadLogo),
)
router.post(
  '/:id/banner',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  singleImageUpload('banner'),
  asyncHandler(controller.uploadBanner),
)
router.get('/:id', optionalAuthenticate, validate({ params: idParams }), asyncHandler(controller.getOne))
router.put(
  '/:id',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams, body: updateClubSchema }),
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
