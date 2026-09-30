import { Router } from 'express'
import { health } from '../controllers/health.controller.js'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import clubRoutes from './club.routes.js'
import eventRoutes from './event.routes.js'
import noticeRoutes from './notice.routes.js'
import notificationRoutes from './notification.routes.js'
import searchRoutes from './search.routes.js'
import userRoutes from './user.routes.js'
import aiRoutes from './ai.routes.js'

const router = Router()
router.get('/health', health)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/clubs', clubRoutes)
router.use('/events', eventRoutes)
router.use('/notices', noticeRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin', adminRoutes)
router.use('/search', searchRoutes)
router.use('/ai', aiRoutes)

export default router
