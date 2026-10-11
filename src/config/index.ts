import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
) as { name: string; version: string }

export const config = {
  port: Number(process.env.PORT ?? 3000),
  serviceName: packageJson.name,
  serviceVersion: packageJson.version,
}
