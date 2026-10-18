import express from 'express'

import { corsMiddleware } from '@/middlewares/corsMiddleware.js'
import { errorHandler } from '@/middlewares/errorHandler/errorHandler.js'
import { routes } from '@/routes/index.js'

export const app = express()

app.use(corsMiddleware)
app.use(express.json())
app.use(routes)
app.use(errorHandler)
