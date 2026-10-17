import type { ZodError } from 'zod'

import type { ApiError } from '@/types/apiContract.js'

export const toApiError = (_error: unknown): ApiError => ({
  code: 'INTERNAL_ERROR',
  message: '',
})

export const validationErrorToApiError = (_error: ZodError): ApiError => ({
  code: 'INTERNAL_ERROR',
  message: '',
})
