import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
// Défaut de Better Auth (maxPasswordLength) : le dépasser le ferait refuser en INTERNAL_ERROR.
export const PASSWORD_MAX_LENGTH = 128

const NAME_REQUIRED_MESSAGE = 'Le prénom est obligatoire'

export const signUpSchema = z.object({
  name: z
    .string({ error: NAME_REQUIRED_MESSAGE })
    .trim()
    .min(1, NAME_REQUIRED_MESSAGE),
  email: z
    .string({ error: "L'email n'est pas valide" })
    .trim()
    .toLowerCase()
    .pipe(z.email("L'email n'est pas valide")),
  password: z
    .string({ error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères` })
    .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`)
    .max(PASSWORD_MAX_LENGTH, `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères`),
})

const INVALID_CREDENTIALS_MESSAGE = 'Email ou mot de passe incorrect'

// Aucun format vérifié à la connexion : un email ou un mot de passe faux donne toujours le même message (RM13).
export const signInSchema = z.object({
  email: z.string({ error: INVALID_CREDENTIALS_MESSAGE }),
  password: z.string({ error: INVALID_CREDENTIALS_MESSAGE }),
})
