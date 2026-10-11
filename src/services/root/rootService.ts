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
]

export const getApiInfo = (name: string, version: string): ApiInfo => ({
  name,
  version,
  endpoints,
})
