import { Router } from 'express'
import * as controller from '../controllers/user.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { imageUpload } from '../middleware/upload.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import { changePasswordSchema, updateProfileSchema } from '../validators/user.validator.js'

const router = Router()
router.use(authenticate)
router.get('/me', asyncHandler(controller.getMe))
router.put('/me', validate({ body: updateProfileSchema }), asyncHandler(controller.updateMe))
router.patch('/me/password', validate({ body: changePasswordSchema }), asyncHandler(controller.updatePassword))
router.post('/me/avatar', imageUpload.single('avatar'), asyncHandler(controller.uploadAvatar))

export default router
