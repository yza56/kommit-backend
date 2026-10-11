import type { Request, Response } from 'express'

import { getHealth } from '@/services/health/healthService.js'

export const getHealthStatus = (_req: Request, res: Response) => {
  res.json(getHealth(process.uptime(), new Date()))
}
