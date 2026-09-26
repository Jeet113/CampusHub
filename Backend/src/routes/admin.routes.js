import { Router } from 'express'
import * as controller from '../controllers/admin.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  approvalSchema,
  clubStatusSchema,
  eventStatusSchema,
  seedClubSchema,
  userStatusSchema,
} from '../validators/admin.validator.js'
import { idParams } from '../validators/common.validator.js'

const router = Router()
router.use(authenticate, requireRole('admin'))

router.get('/metrics', asyncHandler(controller.metrics))
router.get('/users', asyncHandler(controller.users))
router.get('/users/:id', validate({ params: idParams }), asyncHandler(controller.getUser))
router.get('/approvals', asyncHandler(controller.approvals))
router.post('/approvals/:id/approve', validate({ params: idParams, body: approvalSchema }), asyncHandler(controller.approve))
router.post('/approvals/:id/reject', validate({ params: idParams, body: approvalSchema }), asyncHandler(controller.reject))
router.post('/clubs', validate({ body: seedClubSchema }), asyncHandler(controller.seedClub))
router.patch('/users/:id/status', validate({ params: idParams, body: userStatusSchema }), asyncHandler(controller.updateUserStatus))
router.patch('/clubs/:id/status', validate({ params: idParams, body: clubStatusSchema }), asyncHandler(controller.updateClubStatus))
router.patch('/events/:id/status', validate({ params: idParams, body: eventStatusSchema }), asyncHandler(controller.updateEventStatus))
router.delete('/users/:id', validate({ params: idParams }), asyncHandler(controller.removeUser))

export default router
