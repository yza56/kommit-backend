import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8

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
    .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`),
})
