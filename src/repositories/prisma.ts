import { PrismaPg } from '@prisma/adapter-pg'

import { config } from '@/config/index.js'
import { PrismaClient } from '@/repositories/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: config.databaseUrl })

export const prisma = new PrismaClient({ adapter })
