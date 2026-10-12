import express from 'express'

import { corsMiddleware } from '@/middlewares/corsMiddleware.js'
import { routes } from '@/routes/index.js'

export const app = express()

app.use(corsMiddleware)
app.use(routes)
