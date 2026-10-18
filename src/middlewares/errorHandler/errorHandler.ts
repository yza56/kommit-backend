import type { NextFunction, Request, Response } from 'express'

import { toApiError, toHttpStatus } from '@/services/auth/authErrors/authErrors.js'
import type { ApiError } from '@/types/apiContract.js'

const INVALID_JSON: ApiError = {
  code: 'VALIDATION_ERROR',
  message: "Le corps de la requête n'est pas un JSON valide",
}

// Erreur levée par express.json() sur un corps illisible.
const isInvalidJson = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed'

export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (isInvalidJson(error)) {
    res.status(toHttpStatus(INVALID_JSON)).json(INVALID_JSON)
    return
  }

  console.error('Erreur non gérée', error)
  const apiError = toApiError(error)
  res.status(toHttpStatus(apiError)).json(apiError)
}
