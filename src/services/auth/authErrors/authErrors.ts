import { APIError } from 'better-auth/api'
import type { ZodError } from 'zod'

import type { ApiError } from '@/types/apiContract.js'

const EMAIL_ALREADY_EXISTS: ApiError = {
  code: 'EMAIL_ALREADY_EXISTS',
  message: 'Un compte avec cet email existe déjà',
}

const INVALID_CREDENTIALS: ApiError = {
  code: 'INVALID_CREDENTIALS',
  message: 'Email ou mot de passe incorrect',
}

const INTERNAL_ERROR: ApiError = {
  code: 'INTERNAL_ERROR',
  message: 'Une erreur est survenue, réessaie dans un instant',
}

const PRISMA_UNIQUE_VIOLATION = 'P2002'

const isPrismaUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === PRISMA_UNIQUE_VIOLATION

const betterAuthCode = (error: unknown): unknown =>
  error instanceof APIError && typeof error.body === 'object' && error.body !== null
    ? (error.body as { code?: unknown }).code
    : undefined

const fromBetterAuthCode = (code: unknown): ApiError => {
  switch (code) {
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return { ...EMAIL_ALREADY_EXISTS }
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_EMAIL':
      return { ...INVALID_CREDENTIALS }
    default:
      return { ...INTERNAL_ERROR }
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (isPrismaUniqueViolation(error)) return { ...EMAIL_ALREADY_EXISTS }

  return fromBetterAuthCode(betterAuthCode(error))
}

const HTTP_STATUS_BY_CODE: Partial<Record<ApiError['code'], number>> = {
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  EMAIL_ALREADY_EXISTS: 422,
}

export const toHttpStatus = (apiError: ApiError): number => HTTP_STATUS_BY_CODE[apiError.code] ?? 500

export const betterAuthResponseToApiError = (body: { code?: unknown }): ApiError =>
  fromBetterAuthCode(body.code)

export const validationErrorToApiError = (error: ZodError): ApiError => ({
  code: 'VALIDATION_ERROR',
  message: error.issues[0]?.message ?? INTERNAL_ERROR.message,
})
