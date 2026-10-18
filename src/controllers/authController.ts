import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'

import { auth } from '@/repositories/authRepository.js'
import {
  betterAuthResponseToApiError,
  toApiError,
  toHttpStatus,
} from '@/services/auth/authErrors/authErrors.js'
import type { ApiError } from '@/types/apiContract.js'

const toWebRequest = (req: ExpressRequest, body: unknown): Request => {
  const headers = new Headers()

  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  // Le corps est re-sérialisé après validation : l'ancienne longueur ne vaut plus.
  headers.delete('content-length')

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  return new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
    method: req.method,
    headers,
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
  })
}

const readErrorBody = async (response: Response): Promise<{ code?: unknown }> => {
  try {
    return (await response.json()) as { code?: unknown }
  } catch {
    return {}
  }
}

const sendApiError = (res: ExpressResponse, apiError: ApiError): void => {
  res.status(toHttpStatus(apiError)).json(apiError)
}

const sendBetterAuthResponse = async (res: ExpressResponse, response: Response): Promise<void> => {
  if (response.status >= 400) {
    const body = await readErrorBody(response)
    const apiError = betterAuthResponseToApiError(body)

    if (apiError.code === 'INTERNAL_ERROR') {
      console.error(`Réponse Better Auth non reconnue (${response.status})`, body)
    }

    sendApiError(res, apiError)
    return
  }

  for (const cookie of response.headers.getSetCookie()) res.append('Set-Cookie', cookie)

  const contentType = response.headers.get('content-type')
  if (contentType) res.type(contentType)

  res.status(response.status).send(await response.text())
}

export const authHandler = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const body = res.locals.body ?? req.body

    await sendBetterAuthResponse(res, await auth.handler(toWebRequest(req, body)))
  } catch (error) {
    console.error('Erreur dans authHandler', error)
    sendApiError(res, toApiError(error))
  }
}
