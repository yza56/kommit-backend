import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
) as { name: string; version: string }

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL est absente : copier .env.example vers .env et la renseigner')
}

const betterAuthSecret = process.env.BETTER_AUTH_SECRET

if (!betterAuthSecret) {
  throw new Error('BETTER_AUTH_SECRET est absente : la renseigner dans .env (voir .env.example)')
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  serviceName: packageJson.name,
  serviceVersion: packageJson.version,
  databaseUrl,
  betterAuthSecret,
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  allowedOrigins: [5173, 5174, 5175, 5176].map((port) => `http://localhost:${port}`),
}
