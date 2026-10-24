import { describe, expect, it } from 'vitest'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, signInSchema, signUpSchema } from '@/services/auth/authValidation/authValidation.js'

const validSignUp = {
  name: 'Marc',
  email: 'marc@x.com',
  password: 'motdepasse',
}

describe("Validation à l'inscription (schéma Zod unique)", () => {
  describe('RM10 : email mal formé ou mot de passe trop court', () => {
    it.each(['pas-un-email', 'marc@', '@x.com', 'marc x@x.com', ''])(
      "refuse l'email mal formé %j",
      (badEmail) => {
        const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, email: badEmail })

        expect(parsedSignUp.success).toBe(false)
        expect(parsedSignUp.error?.issues.map((issue) => issue.path[0])).toContain('email')
      },
    )

    it('fixe le minimum du mot de passe à 8 caractères', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(8)
    })

    it('refuse un mot de passe de 7 caractères', () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(7) })

      expect(parsedSignUp.success).toBe(false)
      expect(parsedSignUp.error?.issues.map((issue) => issue.path[0])).toContain('password')
    })

    it('accepte un mot de passe de 8 caractères pile', () => {
      const password = 'a'.repeat(8)

      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password })

      expect(parsedSignUp.data).toEqual({ ...validSignUp, password })
    })

    it('fixe le maximum du mot de passe à 128 caractères', () => {
      expect(PASSWORD_MAX_LENGTH).toBe(128)
    })

    it('accepte un mot de passe de 128 caractères pile', () => {
      const password = 'a'.repeat(128)

      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password })

      expect(parsedSignUp.data).toEqual({ ...validSignUp, password })
    })

    it('refuse un mot de passe de 129 caractères en citant le maximum de 128', () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(129) })

      const passwordIssue = parsedSignUp.error?.issues.find((issue) => issue.path[0] === 'password')
      expect(parsedSignUp.success).toBe(false)
      expect(passwordIssue?.message ?? '').toMatch(/128/)
    })

    it("cite le minimum de 8 dans le message d'erreur du mot de passe", () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(7) })

      const passwordIssue = parsedSignUp.error?.issues.find((issue) => issue.path[0] === 'password')
      expect(passwordIssue?.message ?? '').toMatch(/8/)
    })

    it('ne modifie pas le mot de passe (ni trim, ni minuscules)', () => {
      const password = '  AbCdEfGh  '

      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, password })

      expect(parsedSignUp.data?.password).toBe(password)
    })

    it('refuse un mot de passe absent', () => {
      const { password: _password, ...signUpWithoutPassword } = validSignUp

      const parsedSignUp = signUpSchema.safeParse(signUpWithoutPassword)

      expect(parsedSignUp.success).toBe(false)
    })
  })

  describe('RM11 : signup sans prénom', () => {
    it('refuse un prénom absent', () => {
      const { name: _name, ...signUpWithoutName } = validSignUp

      const parsedSignUp = signUpSchema.safeParse(signUpWithoutName)

      expect(parsedSignUp.success).toBe(false)
      expect(parsedSignUp.error?.issues.map((issue) => issue.path[0])).toContain('name')
    })

    it('refuse un prénom vide', () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, name: '' })

      expect(parsedSignUp.success).toBe(false)
      expect(parsedSignUp.error?.issues.map((issue) => issue.path[0])).toContain('name')
    })

    it('accepte un prénom valide et le laisse intact', () => {
      const parsedSignUp = signUpSchema.safeParse(validSignUp)

      expect(parsedSignUp.data).toEqual(validSignUp)
    })
  })

  describe("RM20 : prénom d'espaces seulement, refusé comme RM11", () => {
    it.each(['   ', '\t', ' \n '])('refuse le prénom %j', (blankName) => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, name: blankName })

      expect(parsedSignUp.success).toBe(false)
      expect(parsedSignUp.error?.issues.map((issue) => issue.path[0])).toContain('name')
    })

    it("donne le même message pour un prénom d'espaces, vide et absent", () => {
      const { name: _name, ...signUpWithoutName } = validSignUp

      const messageForBlankName = signUpSchema.safeParse({ ...validSignUp, name: '   ' }).error?.issues[0]?.message
      const messageForEmptyName = signUpSchema.safeParse({ ...validSignUp, name: '' }).error?.issues[0]?.message
      const messageForMissingName = signUpSchema.safeParse(signUpWithoutName).error?.issues[0]?.message

      expect(messageForBlankName ?? '').toMatch(/\S/)
      expect(messageForEmptyName).toBe(messageForBlankName)
      expect(messageForMissingName).toBe(messageForBlankName)
    })

    it("retire les espaces autour d'un prénom valide", () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, name: '  Marc  ' })

      expect(parsedSignUp.data?.name).toBe('Marc')
    })
  })
})

describe("Unicité de l'email", () => {
  describe("RM21 : normalisation de l'email (insensible à la casse et aux espaces)", () => {
    it("met l'email en minuscules et retire les espaces autour", () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, email: ' MARC@x.com ' })

      expect(parsedSignUp.data?.email).toBe('marc@x.com')
    })

    it('normalise " MARC@x.com " vers la même valeur que "marc@x.com"', () => {
      const emailFromExistingAccount = signUpSchema.safeParse(validSignUp).data?.email
      const emailFromRetry = signUpSchema.safeParse({ ...validSignUp, email: ' MARC@x.com ' }).data?.email

      expect(emailFromExistingAccount).toBe('marc@x.com')
      expect(emailFromRetry).toBe(emailFromExistingAccount)
    })

    it("valide l'email après normalisation (espaces autour acceptés)", () => {
      const parsedSignUp = signUpSchema.safeParse({ ...validSignUp, email: '\t marc@x.com\n' })

      expect(parsedSignUp.data?.email).toBe('marc@x.com')
    })
  })
})

describe('Validation à la connexion (RM13 : aucun format vérifié)', () => {
  it('accepte un email mal formé et un mot de passe court', () => {
    const malformedSignIn = { email: 'pas-un-email', password: 'abc' }

    const parsedSignIn = signInSchema.safeParse(malformedSignIn)

    expect(parsedSignIn.data).toEqual(malformedSignIn)
  })

  it('accepte un mot de passe vide', () => {
    const signInWithoutPassword = { email: 'marc@x.com', password: '' }

    expect(signInSchema.safeParse(signInWithoutPassword).success).toBe(true)
  })

  it.each([
    ['un corps vide', {}],
    ['un mot de passe absent', { email: 'marc@x.com' }],
    ['un email absent', { password: 'motdepasse' }],
    ['un email qui est un nombre', { email: 123, password: 'motdepasse' }],
  ])('refuse %s', (_label, body) => {
    expect(signInSchema.safeParse(body).success).toBe(false)
  })
})
