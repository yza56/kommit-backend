type Endpoint = {
  method: string
  path: string
  description: string
}

type ApiInfo = {
  name: string
  version: string
  endpoints: Endpoint[]
}

const endpoints: Endpoint[] = [
  { method: 'GET', path: '/', description: "Informations sur l'API et liste des endpoints" },
  { method: 'GET', path: '/health', description: "État du process (status, uptime, timestamp)" },
  { method: 'GET', path: '/db-health', description: "État de la base de données (status, latencyMs), 503 si injoignable" },
]

export const getApiInfo = (name: string, version: string): ApiInfo => ({
  name,
  version,
  endpoints,
})
