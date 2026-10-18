import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

import { validationErrorToApiError } from '@/services/auth/authErrors/authErrors.js'

export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsedBody = schema.safeParse(req.body)

    if (!parsedBody.success) {
      res.status(400).json(validationErrorToApiError(parsedBody.error))
      return
    }

    res.locals.body = parsedBody.data
    next()
  }
