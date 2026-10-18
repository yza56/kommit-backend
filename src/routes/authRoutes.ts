import { Router } from 'express'

import { authHandler } from '@/controllers/authController.js'

export const authRoutes = Router()

authRoutes.all('/*splat', authHandler)
