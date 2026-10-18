import { APIError } from 'better-auth/api'
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'

import { auth } from '@/repositories/auth.js'
import { toApiError, validationErrorToApiError } from '@/services/auth/authErrors/authErrors.js'
import { signUpSchema } from '@/services/auth/authValidation/authValidation.js'

const SIGN_UP_PATH = '/sign-up/email'

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

const readErrorBody = async (response: Response): Promise<{ code: string; message: string }> => {
  try {
    const { code, message } = (await response.json()) as { code?: unknown; message?: unknown }
    return { code: String(code ?? ''), message: String(message ?? '') }
  } catch {
    return { code: '', message: '' }
  }
}

const sendBetterAuthResponse = async (res: ExpressResponse, response: Response): Promise<void> => {
  if (response.status >= 400) {
    const body = await readErrorBody(response)
    // toApiError ne lit que body.code : le statut passé ici n'a pas d'effet, le vrai est repris pour la réponse.
    res.status(response.status).json(toApiError(APIError.from('BAD_REQUEST', body)))
    return
  }

  for (const cookie of response.headers.getSetCookie()) res.append('Set-Cookie', cookie)

  const contentType = response.headers.get('content-type')
  if (contentType) res.type(contentType)

  res.status(response.status).send(await response.text())
}

export const authHandler = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    let body: unknown = req.body

    if (req.method === 'POST' && req.path === SIGN_UP_PATH) {
      const parsedSignUp = signUpSchema.safeParse(body)

      if (!parsedSignUp.success) {
        res.status(400).json(validationErrorToApiError(parsedSignUp.error))
        return
      }

      body = parsedSignUp.data
    }

    await sendBetterAuthResponse(res, await auth.handler(toWebRequest(req, body)))
  } catch (error) {
    res.status(500).json(toApiError(error))
  }
}
