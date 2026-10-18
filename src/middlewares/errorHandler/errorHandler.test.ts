import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { errorHandler } from '@/middlewares/errorHandler/errorHandler.js'

const status = vi.fn()
const json = vi.fn()
const next = vi.fn()

const request = {} as Request
const response = { status, json, headersSent: false } as unknown as Response

beforeEach(() => {
  status.mockReset().mockReturnValue(response)
  json.mockReset()
  next.mockReset()
  response.headersSent = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('errorHandler', () => {
  it('répond 400 VALIDATION_ERROR quand le corps JSON est illisible', () => {
    const invalidJsonError = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' })

    errorHandler(invalidJsonError, request, response, next as NextFunction)

    expect(status).toHaveBeenCalledWith(400)
    expect(json.mock.calls[0]?.[0].code).toBe('VALIDATION_ERROR')
  })

  it('répond 500 INTERNAL_ERROR pour une erreur inconnue, sans exposer son message', () => {
    errorHandler(new Error('connect ETIMEDOUT 10.0.0.1:5432'), request, response, next as NextFunction)

    const sentBody = json.mock.calls[0]?.[0]
    expect(status).toHaveBeenCalledWith(500)
    expect(sentBody.code).toBe('INTERNAL_ERROR')
    expect(sentBody.message).not.toMatch(/ETIMEDOUT/)
  })

  it('passe la main à Express quand la réponse est déjà partie', () => {
    const lateError = new Error('boom')
    response.headersSent = true

    errorHandler(lateError, request, response, next as NextFunction)

    expect(next).toHaveBeenCalledWith(lateError)
    expect(status).not.toHaveBeenCalled()
  })
})
