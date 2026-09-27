import { Router } from 'express'
import * as controller from '../controllers/event.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { singleImageUpload } from '../middleware/upload.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import { idParams } from '../validators/common.validator.js'
import { createEventSchema, eventQuerySchema, eventStatusSchema, updateEventSchema } from '../validators/event.validator.js'

const router = Router()

router.get('/', optionalAuthenticate, validate({ query: eventQuerySchema }), asyncHandler(controller.list))
router.post('/', authenticate, requireRole('club', 'admin'), validate({ body: createEventSchema }), asyncHandler(controller.create))
router.patch(
  '/:id/status',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams, body: eventStatusSchema }),
  asyncHandler(controller.updateStatus),
)
router.post('/:id/register', authenticate, requireRole('student'), validate({ params: idParams }), asyncHandler(controller.register))
router.delete(
  '/:id/register',
  authenticate,
  requireRole('student'),
  validate({ params: idParams }),
  asyncHandler(controller.cancelRegistration),
)
router.post('/:id/save', authenticate, requireRole('student'), validate({ params: idParams }), asyncHandler(controller.save))
router.delete('/:id/save', authenticate, requireRole('student'), validate({ params: idParams }), asyncHandler(controller.unsave))
router.post(
  '/:id/banner',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  singleImageUpload('banner'),
  asyncHandler(controller.uploadBanner),
)
router.get('/my/registered', authenticate, requireRole('student'), asyncHandler(controller.listMyRegistrations))
router.get('/my/saved', authenticate, requireRole('student'), asyncHandler(controller.listMySaved))
router.get('/:id', optionalAuthenticate, validate({ params: idParams }), asyncHandler(controller.getOne))
router.get(
  '/:id/registrations',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams }),
  asyncHandler(controller.listRegistrations),
)
router.put(
  '/:id',
  authenticate,
  requireRole('club', 'admin'),
  validate({ params: idParams, body: updateEventSchema }),
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
