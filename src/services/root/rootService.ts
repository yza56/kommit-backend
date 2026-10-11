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
]

export const getApiInfo = (name: string, version: string): ApiInfo => ({
  name,
  version,
  endpoints,
})
