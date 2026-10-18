# Inventaire de test, KOM-06 (Authentification, backend)

> Le ticket ne définit pas de paquets de règles et compte 11 lignes (> 8). Le découpage ci-dessous vient de l'inventaire, pas du ticket. Les règles gardent l'ordre du ticket à l'intérieur de chaque paquet.

### Session : signup, signin, signout

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM8 | Signup valide : le compte est créé ET l'utilisateur est connecté automatiquement | 🔴 | Le comportement sous test est celui de Better Auth (création du compte, pose du cookie de session) et de la config cross-origin (`credentials: true`, `trustedOrigins`). Le mocker reviendrait à mocker ce qu'on veut vérifier. | Manuel (smoke) |
| RM12 | Signin avec email et mot de passe corrects : l'utilisateur est connecté | 🔴 | Vérification du mot de passe et pose de la session par Better Auth, cookie en cross-origin (front `:5173`, back `:3000`). Aucune logique à nous. | Manuel (smoke) |
| RM5 | Signout d'un utilisateur connecté : sa session est fermée | 🔴 | Fermeture de session réelle par Better Auth sur `/sign-out`, à confirmer avec `/get-session` ensuite. | Manuel (smoke) |

### Validation à l'inscription (schéma Zod unique)

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM10 | Email mal formé ou mot de passe < 8 caractères : refusé, aucun compte créé. Maximum de 128. | 🟠 | Le schéma Zod est du code à nous (unitaire : email invalide, 7 caractères refusé, 8 accepté, 128 accepté, 129 refusé). Reste le branchement réel du schéma sur `/sign-up/email` et l'absence de compte créé, que le test unitaire ne confirme pas. Le 8 doit aussi être identique dans la config Better Auth, l'indication affichée et le message d'erreur. | Unitaire (schéma) + smoke manuel : signup avec email mal formé, puis mot de passe de 7 caractères, vérifier le refus et qu'aucun compte n'existe |
| RM11 | Signup sans prénom : refusé, aucun compte créé | 🟢 | Validation Zod pure sur le champ `name`. Le branchement du schéma sur la route est déjà couvert par le smoke de RM10. | Unitaire, test-first |
| RM20 | Prénom d'espaces seulement : refusé exactement comme RM11 | 🟢 | Le `trim` du schéma Zod ramène le prénom à vide, puis même refus que RM11 (même code d'erreur, même message). | Unitaire, test-first |

### Unicité de l'email

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM9 | Email déjà utilisé : le serveur répond `EMAIL_ALREADY_EXISTS`, aucun compte créé. Une violation `UNIQUE` ressort en RM9, jamais en 500. | 🟠 | Notre mapping erreur Better Auth / Prisma (`UNIQUE`) vers `ApiError` est testable en mémoire, mais la forme d'erreur mockée n'est confirmée par aucun smoke. La contrainte `UNIQUE` qui rejette réellement le doublon relève de la base. | Unitaire (mapping) + smoke manuel : 2 signups avec le même email, vérifier `EMAIL_ALREADY_EXISTS` (pas de 500) et un seul compte en base |
| RM21 | Compte `marc@x.com` existant, tentative avec `" MARC@x.com "` : refusée. Unicité insensible à la casse et aux espaces. | 🟠 | La normalisation (trim + minuscules) du schéma Zod est du code à nous (unitaire). Que l'email normalisé soit bien celui stocké et comparé par la contrainte `UNIQUE` n'est vérifié par aucun smoke existant. | Unitaire (normalisation) + smoke manuel : créer `marc@x.com`, retenter avec `" MARC@x.com "`, vérifier le refus `EMAIL_ALREADY_EXISTS` |

### Erreurs et pannes

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM13 | Signin avec email ou mot de passe incorrect : le serveur répond `INVALID_CREDENTIALS` | 🟠 | Le mapping de l'erreur Better Auth vers `ApiError` est du code à nous, mais la forme d'erreur réelle de Better Auth (mockée) n'est confirmée par aucun smoke. | Unitaire (mapping) + smoke manuel : signin avec mauvais mot de passe, puis avec email inconnu, vérifier `INVALID_CREDENTIALS` |
| RM18, RM19 | Panne (5xx, timeout) : ressort en `INTERNAL_ERROR`, distinct des erreurs métier. Une erreur non reconnue ne ressort jamais brute. | 🟠 | La règle de repli (tout ce qui n'est pas reconnu devient `INTERNAL_ERROR`, message en français) est du code à nous (unitaire). Les formes réelles d'une panne Prisma ou d'un timeout ne sont confirmées par aucun smoke. | Unitaire (repli du ré-emballage) + smoke manuel : base injoignable (mauvaise `DATABASE_URL`), vérifier `INTERNAL_ERROR` |

### Route protégée

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM2 | Requête sur une route protégée sans session : 401 | 🟢 | Décision du middleware de protection : session absente (`null`) donne 401 `ApiError`. On mocke la lecture de session. La session valide réelle est couverte par le smoke de RM12. | Unitaire, test-first |

## Récap

**Test unitaire automatisé (vers `unit-test-writer`)**
- RM11 : prénom absent refusé
- RM20 : prénom d'espaces seulement refusé comme RM11
- RM2 : 401 sans session sur route protégée

**Couverture partielle, 🟠 (unitaire + smoke manuel à faire)**
- RM10 : unitaire du schéma Zod + smoke signup email mal formé / mot de passe de 7 caractères, aucun compte créé
- RM9 : unitaire du mapping `UNIQUE` + smoke double signup, `EMAIL_ALREADY_EXISTS`, jamais 500
- RM21 : unitaire de la normalisation + smoke `" MARC@x.com "` refusé
- RM13 : unitaire du mapping + smoke mauvais mot de passe et email inconnu
- RM18, RM19 : unitaire du repli `INTERNAL_ERROR` + smoke base injoignable

**Vérification manuelle (vers `smoke-test-writer`)**
- RM8 : signup valide, compte créé et connecté
- RM12 : signin correct, connecté
- RM5 : signout, session fermée

## Notes

- Les contraintes techniques sans règle propre (CORS `credentials: true`, `trustedOrigins`, ESLint sur l'alias `@/`, routes Better Auth réutilisées) ne sont pas des lignes de l'inventaire. La config CORS / `trustedOrigins` conditionne les smokes RM8 et RM12.
