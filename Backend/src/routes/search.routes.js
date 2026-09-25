import { Router } from 'express'
import { search } from '../controllers/search.controller.js'
import { validate } from '../middleware/validation.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import { searchQuerySchema } from '../validators/admin.validator.js'

const router = Router()
router.get('/', validate({ query: searchQuerySchema }), asyncHandler(search))
export default router
