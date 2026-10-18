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
  { method: 'POST', path: '/api/auth/sign-up/email', description: "Création de compte (prénom, email, mot de passe), connecte l'utilisateur" },
  { method: 'POST', path: '/api/auth/sign-in/email', description: "Connexion par email et mot de passe" },
  { method: 'POST', path: '/api/auth/sign-out', description: "Déconnexion, ferme la session" },
  { method: 'GET', path: '/api/auth/get-session', description: "Session courante, null si personne n'est connecté" },
]

export const getApiInfo = (name: string, version: string): ApiInfo => ({
  name,
  version,
  endpoints,
})
