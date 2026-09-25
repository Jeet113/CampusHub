import { Router } from 'express'
import * as controller from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authRateLimit } from '../middleware/rateLimit.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
} from '../validators/auth.validator.js'

const router = Router()

router.post('/send-otp', authRateLimit, validate({ body: sendOtpSchema }), asyncHandler(controller.sendOtp))
router.post('/register', authRateLimit, validate({ body: registerSchema }), asyncHandler(controller.register))
router.post('/login', authRateLimit, validate({ body: loginSchema }), asyncHandler(controller.login))
router.post('/logout', validate({ body: refreshSchema }), asyncHandler(controller.logout))
router.post('/refresh', validate({ body: refreshSchema }), asyncHandler(controller.refresh))
router.get('/me', authenticate, asyncHandler(controller.me))
router.post('/forgot-password', authRateLimit, validate({ body: forgotPasswordSchema }), asyncHandler(controller.forgotPassword))
router.post('/reset-password', authRateLimit, validate({ body: resetPasswordSchema }), asyncHandler(controller.completePasswordReset))

export default router
