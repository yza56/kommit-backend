type Health = {
  status: 'ok'
  uptime: number
  timestamp: string
}

export const getHealth = (uptimeInSeconds: number, now: Date): Health => ({
  status: 'ok',
  uptime: uptimeInSeconds,
  timestamp: now.toISOString(),
})
