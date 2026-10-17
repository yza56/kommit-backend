import { APIError } from 'better-auth/api'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { PrismaClientKnownRequestError } from '@/repositories/generated/prisma/internal/prismaNamespace.js'
import { toApiError, validationErrorToApiError } from '@/services/auth/authErrors/authErrors.js'

// Formes constatées dans le code source de better-auth 1.7.10 (@better-auth/core, better-call) :
// APIError.from(status, { code, message }) donne error.body = { code, message }.
const emailAlreadyUsedByBetterAuth = () =>
  APIError.from('UNPROCESSABLE_ENTITY', {
    code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
    message: 'User already exists. Use another email.',
  })

const invalidCredentialsByBetterAuth = () =>
  APIError.from('UNAUTHORIZED', {
    code: 'INVALID_EMAIL_OR_PASSWORD',
    message: 'Invalid email or password',
  })

const prismaUniqueViolation = () =>
  new PrismaClientKnownRequestError('Unique constraint failed on the fields: (`email`)', {
    code: 'P2002',
    clientVersion: '7.10.0',
  })

describe("Unicité de l'email", () => {
  describe('RM9 : email déjà utilisé', () => {
    it("ré-emballe l'erreur \"utilisateur existant\" de Better Auth en EMAIL_ALREADY_EXISTS", () => {
      const apiError = toApiError(emailAlreadyUsedByBetterAuth())

      expect(apiError.code).toBe('EMAIL_ALREADY_EXISTS')
      expect(apiError.message).toMatch(/\S/)
    })

    it('ré-emballe aussi le code USER_ALREADY_EXISTS de Better Auth', () => {
      const betterAuthError = APIError.from('UNPROCESSABLE_ENTITY', {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists.',
      })

      expect(toApiError(betterAuthError).code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('ré-emballe une violation UNIQUE de Prisma (P2002) en EMAIL_ALREADY_EXISTS, jamais en INTERNAL_ERROR', () => {
      const apiError = toApiError(prismaUniqueViolation())

      expect(apiError.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it("donne le même message pour la violation UNIQUE de Prisma et pour l'erreur de Better Auth", () => {
      const messageFromBetterAuth = toApiError(emailAlreadyUsedByBetterAuth()).message
      const messageFromPrisma = toApiError(prismaUniqueViolation()).message

      expect(messageFromPrisma).toMatch(/\S/)
      expect(messageFromPrisma).toBe(messageFromBetterAuth)
    })

    it('écrit le message en français, sans texte brut de la librairie', () => {
      const apiError = toApiError(emailAlreadyUsedByBetterAuth())

      expect(apiError.message).toMatch(/\S/)
      expect(apiError.message).not.toMatch(/User already exists/i)
    })
  })
})

describe('Erreurs et pannes', () => {
  describe('RM13 : email ou mot de passe incorrect au signin', () => {
    it('ré-emballe INVALID_EMAIL_OR_PASSWORD de Better Auth en INVALID_CREDENTIALS', () => {
      const apiError = toApiError(invalidCredentialsByBetterAuth())

      expect(apiError.code).toBe('INVALID_CREDENTIALS')
      expect(apiError.message).toMatch(/\S/)
    })

    it('écrit le message en français, sans texte brut de la librairie', () => {
      const apiError = toApiError(invalidCredentialsByBetterAuth())

      expect(apiError.message).toMatch(/\S/)
      expect(apiError.message).not.toMatch(/Invalid email or password/i)
    })
  })

  describe('RM18, RM19 : panne (5xx, timeout), distincte des erreurs métier', () => {
    const outages: Array<[string, () => unknown]> = [
      ['une erreur 500 de Better Auth', () => APIError.from('INTERNAL_SERVER_ERROR', { code: 'INTERNAL_SERVER_ERROR', message: 'boom' })],
      ['une erreur Prisma de connexion (P1001)', () => new PrismaClientKnownRequestError("Can't reach database server", { code: 'P1001', clientVersion: '7.10.0' })],
      ['un timeout', () => new Error('connect ETIMEDOUT 10.0.0.1:5432')],
      ['une erreur Better Auth non reconnue', () => APIError.from('BAD_REQUEST', { code: 'SOMETHING_NEW', message: 'Something new' })],
      ["une valeur jetée qui n'est pas une Error", () => 'oups'],
      ['null', () => null],
      ['undefined', () => undefined],
    ]

    it.each(outages)('ressort en INTERNAL_ERROR pour %s', (_label, buildError) => {
      const apiError = toApiError(buildError())

      expect(apiError.code).toBe('INTERNAL_ERROR')
      expect(apiError.message).toMatch(/\S/)
    })

    it("ne laisse jamais passer le message brut de l'erreur", () => {
      const apiError = toApiError(new Error('connect ETIMEDOUT 10.0.0.1:5432'))

      expect(apiError.message).toMatch(/\S/)
      expect(apiError.message).not.toMatch(/ETIMEDOUT|10\.0\.0\.1/)
    })

    it('ne renvoie que code et message', () => {
      const apiError = toApiError(new Error('boom'))

      expect(Object.keys(apiError).sort()).toEqual(['code', 'message'])
      expect(apiError.message).toMatch(/\S/)
    })
  })

  describe('Refus de validation (RM10, RM11, RM20) ré-emballé en ApiError', () => {
    it('ré-emballe une erreur Zod en VALIDATION_ERROR avec le message de la première erreur', () => {
      const zodError = z.object({ name: z.string().min(1, 'Le prénom est obligatoire') }).safeParse({ name: '' }).error!

      const apiError = validationErrorToApiError(zodError)

      expect(apiError).toEqual({ code: 'VALIDATION_ERROR', message: 'Le prénom est obligatoire' })
    })
  })
})
