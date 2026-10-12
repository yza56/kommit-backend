export type DbHealthRepository = {
  ping: () => Promise<void>
}

export type DbHealth =
  | { status: 'ok'; latencyMs: number }
  | { status: 'unreachable' }

export const checkDbHealth = async (
  repository: DbHealthRepository,
  now: () => number,
): Promise<DbHealth> => {
  const start = now()

  try {
    await repository.ping()
  } catch {
    return { status: 'unreachable' }
  }

  return { status: 'ok', latencyMs: Math.round(now() - start) }
}
