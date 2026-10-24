import { Router } from 'express'

import { authHandler } from '@/controllers/authController.js'
import { validateBody } from '@/middlewares/validateBody/validateBody.js'
import { signInSchema, signUpSchema } from '@/services/auth/authValidation/authValidation.js'

export const authRoutes = Router()

authRoutes.post('/sign-up/email', validateBody(signUpSchema), authHandler)
authRoutes.post('/sign-in/email', validateBody(signInSchema), authHandler)
authRoutes.all('/*splat', authHandler)
