import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { fromNodeHeaders } from 'better-auth/node'

import { config } from '@/config/index.js'
import { prisma } from '@/repositories/prisma.js'
import { PASSWORD_MIN_LENGTH } from '@/services/auth/authValidation/authValidation.js'
import type { SessionReader } from '@/middlewares/requireSession/requireSession.js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigins: config.allowedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
  },
})

export const readSession: SessionReader = async (headers) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) })

  if (!session) return null

  const { id, name, email } = session.user
  return { user: { id, name, email } }
}
