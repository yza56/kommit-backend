import type { NextFunction, Request, Response } from 'express'
import type { IncomingHttpHeaders } from 'node:http'

import type { Session } from '@/types/apiContract.js'

export type SessionReader = (headers: IncomingHttpHeaders) => Promise<Session>

export const createRequireSession =
  (_readSession: SessionReader) =>
  async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {}
