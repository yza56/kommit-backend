import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { validateBody } from '@/middlewares/validateBody/validateBody.js'

const status = vi.fn()
const json = vi.fn()
const next = vi.fn()

const schema = z.object({ name: z.string().trim().min(1, 'Le prénom est obligatoire') })
const response = { status, json, locals: {} as Record<string, unknown> } as unknown as Response

beforeEach(() => {
  status.mockReset().mockReturnValue(response)
  json.mockReset()
  next.mockReset()
  response.locals = {}
})

describe('validateBody', () => {
  it('pose le corps validé dans res.locals.body et passe la main', () => {
    const request = { body: { name: '  Marc  ' } } as Request

    validateBody(schema)(request, response, next as NextFunction)

    expect(response.locals.body).toEqual({ name: 'Marc' })
    expect(next).toHaveBeenCalledOnce()
  })

  it('refuse en 400 avec un ApiError VALIDATION_ERROR', () => {
    const request = { body: { name: '   ' } } as Request

    validateBody(schema)(request, response, next as NextFunction)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith({ code: 'VALIDATION_ERROR', message: 'Le prénom est obligatoire' })
  })

  it('ne passe pas la main au handler quand le corps est refusé', () => {
    const request = { body: {} } as Request

    validateBody(schema)(request, response, next as NextFunction)

    expect(next).not.toHaveBeenCalled()
  })
})
