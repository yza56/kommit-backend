import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRequireSession } from '@/middlewares/requireSession/requireSession.js'
import type { Session } from '@/types/apiContract.js'

const readSession = vi.fn<(headers: Request['headers']) => Promise<Session>>()
const status = vi.fn()
const json = vi.fn()
const next = vi.fn()

const request = { headers: { cookie: 'better-auth.session_token=abc' } } as unknown as Request
const response = { status, json } as unknown as Response

beforeEach(() => {
  readSession.mockReset()
  status.mockReset().mockReturnValue(response)
  json.mockReset()
  next.mockReset()
})

describe('Route protégée', () => {
  describe('RM2 : requête sans session', () => {
    it('répond 401 quand la session est absente (null)', async () => {
      readSession.mockResolvedValue(null)

      await createRequireSession(readSession)(request, response, next as NextFunction)

      expect(status).toHaveBeenCalledWith(401)
    })

    it('répond avec un ApiError dont le message est prêt à afficher', async () => {
      readSession.mockResolvedValue(null)

      await createRequireSession(readSession)(request, response, next as NextFunction)

      const sentBody = json.mock.calls[0]?.[0]
      expect(sentBody?.message ?? '').toMatch(/\S/)
    })

    it('ne passe pas la main au handler de la route', async () => {
      readSession.mockResolvedValue(null)

      await createRequireSession(readSession)(request, response, next as NextFunction)

      expect(next).not.toHaveBeenCalled()
      expect(status).toHaveBeenCalledWith(401)
    })
  })

  describe('Requête avec une session valide', () => {
    it('passe la main au handler sans répondre 401', async () => {
      readSession.mockResolvedValue({ user: { id: 'u1', name: 'Marc', email: 'marc@x.com' } })

      await createRequireSession(readSession)(request, response, next as NextFunction)

      expect(next).toHaveBeenCalledOnce()
      expect(status).not.toHaveBeenCalled()
    })
  })
})
