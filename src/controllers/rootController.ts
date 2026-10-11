import type { Request, Response } from 'express'

import { config } from '@/config/index.js'
import { getApiInfo } from '@/services/root/rootService.js'

export const getRoot = (_req: Request, res: Response) => {
  res.json(getApiInfo(config.serviceName, config.serviceVersion))
}
