import type { Request, Response } from 'express'

import { dbHealthRepository } from '@/repositories/dbHealthRepository.js'
import { checkDbHealth } from '@/services/dbHealth/dbHealthService.js'

export const getDbHealthStatus = async (_req: Request, res: Response) => {
  const dbHealth = await checkDbHealth(dbHealthRepository, () => performance.now())

  res.status(dbHealth.status === 'ok' ? 200 : 503).json(dbHealth)
}
