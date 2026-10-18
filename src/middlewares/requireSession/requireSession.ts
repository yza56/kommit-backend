import type { NextFunction, Request, Response } from 'express'
import type { IncomingHttpHeaders } from 'node:http'

import type { ApiError, Session } from '@/types/apiContract.js'

export type SessionReader = (headers: IncomingHttpHeaders) => Promise<Session>

const UNAUTHENTICATED: ApiError = {
  code: 'UNAUTHENTICATED',
  message: 'Tu dois être connecté pour accéder à cette ressource',
}

export const createRequireSession =
  (readSession: SessionReader) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await readSession(req.headers)

    if (session === null) {
      res.status(401).json(UNAUTHENTICATED)
      return
    }

    next()
  }
