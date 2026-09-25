import { Router } from 'express'
import { z } from 'zod'
import * as controller from '../controllers/notification.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import { idParams, paginationFields } from '../validators/common.validator.js'

const router = Router()
const querySchema = z.object(paginationFields)

router.use(authenticate)
router.get('/', validate({ query: querySchema }), asyncHandler(controller.list))
router.patch('/read-all', asyncHandler(controller.markAllRead))
router.patch('/:id/read', validate({ params: idParams }), asyncHandler(controller.markRead))

export default router
