import { prisma } from '@/repositories/prisma.js'
import type { DbHealthRepository } from '@/services/dbHealth/dbHealthService.js'

export const dbHealthRepository: DbHealthRepository = {
  ping: async () => {
    await prisma.$queryRaw`SELECT 1`
  },
}
