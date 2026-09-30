import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import { aiRateLimit } from '../middleware/rateLimit.middleware.js'
import { chatWithAi } from '../controllers/ai.controller.js'
import { chatMessageSchema } from '../validators/ai.validator.js'

const router = Router()

router.post(
  '/chat',
  authenticate,
  aiRateLimit,
  validate({ body: chatMessageSchema }),
  chatWithAi,
)

export default router
