# Smokes manuels, KOM-06 (Authentification, backend)

> Ces scénarios sont écrits **avant** l'implémentation (test-first) et s'exécutent **après**. Ils ne sont pas exécutés à l'écriture : cocher chaque case au fur et à mesure de l'exécution.
> Même découpage et même ordre que `testing/inventaire-KOM-06.md`. Les règles 🟢 n'ont pas de smoke.

## Préparation commune

Serveur lancé (`pnpm dev`) sur `http://localhost:3000`, base Neon joignable. Les commandes sont en bash (Git Bash ou WSL). Sous PowerShell, remplacer `curl` par `curl.exe` et adapter la syntaxe des variables.

```bash
# À AJUSTER : aucune route d'auth n'existe encore dans le repo. Chemin de base par défaut de Better Auth : /api/auth.
# Si le chemin réel est autre (ex. /auth), changer seulement cette ligne.
AUTH_URL=http://localhost:3000/api/auth
ORIGIN=http://localhost:5173
RUN=$(date +%s)        # rend les emails uniques d'une exécution à l'autre
```

Notes :
- Le header `Origin: $ORIGIN` simule le front (cross-origin). Sans lui, Better Auth peut refuser la requête ou le cookie ne reflète pas le cas réel.
- `-c jar.txt` enregistre les cookies reçus, `-b jar.txt` les renvoie.
- Si `AUTH_URL` répond **404** au lieu des codes attendus ci-dessous : les routes Better Auth ne sont pas montées (ou pas sous ce chemin). C'est un livrable manquant, pas un échec du scénario.
- Contrat : toute erreur a la forme `{ "code": "...", "message": "..." }` (`ApiError`, `src/types/apiContract.ts`). Le contrat ne fixe pas le code HTTP exact des erreurs métier : on attend un 4xx, jamais un 5xx.

---

## Session : signup, signin, signout

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM8 | 🔴 | Signup valide : compte créé et connecté automatiquement | Scénario RM8 |
| RM12 | 🔴 | Signin correct : connecté | Scénario RM12 |
| RM5 | 🔴 | Signout : session fermée | Scénario RM5 |

### RM8 : signup valide, connecté automatiquement

> ✅ **Ce qu'on vérifie :**
> - Un signup valide crée le compte ET pose le cookie de session, sans signin séparé.
> - `/get-session` renvoie ensuite l'utilisateur avec le prénom dans `name`.
> - Se teste à la main : le comportement est celui de Better Auth (création du compte, cookie) et de la config cross-origin (`credentials: true`, `trustedOrigins`). Le mocker reviendrait à mocker ce qu'on veut vérifier.

**Préconditions :** serveur lancé, l'email `marc-$RUN@x.com` n'existe pas.

**Étapes :**

1. Signup, en gardant les en-têtes pour voir le cookie et le CORS :

```bash
curl -i -c jar.txt -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Marc\",\"email\":\"marc-$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

2. Lire la session avec le cookie reçu :

```bash
curl -i -b jar.txt "$AUTH_URL/get-session" -H "Origin: $ORIGIN"
```

**Résultat attendu :**

- Étape 1 : 200, header `Set-Cookie` présent (cookie de session Better Auth, `SameSite=Lax`), `Access-Control-Allow-Origin: http://localhost:5173` et `Access-Control-Allow-Credentials: true`.
- Étape 2 : 200, corps `{ "user": { "id": "...", "name": "Marc", "email": "marc-<RUN>@x.com" }, ... }`.
- Si pas de `Set-Cookie` ou pas de `Allow-Credentials: true` : config CORS / `trustedOrigins` manquante, RM8 échoue.

- [ ] RM8 exécuté et conforme

---

### RM12 : signin correct, connecté

> ✅ **Ce qu'on vérifie :**
> - Signin avec email et mot de passe corrects : 200 et cookie de session posé.
> - La session est lisible avec ce nouveau cookie.
> - Se teste à la main : la vérification du mot de passe et la pose de la session sont faites par Better Auth, et le cookie doit tenir en cross-origin (front `:5173`, back `:3000`). Aucune logique à nous.

**Préconditions :** le compte `marc-$RUN@x.com` / `motdepasse8` existe (créé par RM8, même `RUN`). Pas de cookie : on repart d'un jar vide.

**Étapes :**

1. Signin :

```bash
rm -f jar2.txt
curl -i -c jar2.txt -X POST "$AUTH_URL/sign-in/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"email\":\"marc-$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

2. Lire la session :

```bash
curl -i -b jar2.txt "$AUTH_URL/get-session" -H "Origin: $ORIGIN"
```

**Résultat attendu :**

- Étape 1 : 200, `Set-Cookie` présent, `Access-Control-Allow-Credentials: true`.
- Étape 2 : 200, `user.email` = `marc-<RUN>@x.com`, `user.name` = `Marc`.

- [ ] RM12 exécuté et conforme

---

### RM5 : signout, session fermée

> ✅ **Ce qu'on vérifie :**
> - Signout d'un utilisateur connecté : 200, et le même cookie ne donne plus de session.
> - `/get-session` renvoie `null` après le signout.
> - Se teste à la main : la fermeture de session réelle est faite par Better Auth sur `/sign-out`, et seul `/get-session` ensuite le confirme.

**Préconditions :** `jar2.txt` contient une session valide (issue de RM12).

**Étapes :**

1. Signout :

```bash
curl -i -b jar2.txt -c jar2.txt -X POST "$AUTH_URL/sign-out" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" -d "{}"
```

2. Relire la session avec le même jar :

```bash
curl -i -b jar2.txt "$AUTH_URL/get-session" -H "Origin: $ORIGIN"
```

**Résultat attendu :**

- Étape 1 : 200, le cookie de session est expiré/supprimé (`Set-Cookie` avec `Max-Age=0` ou valeur vide).
- Étape 2 : 200 avec corps `null` (contrat : `Session = ... | null`). Si la session est encore renvoyée, RM5 échoue.

- [ ] RM5 exécuté et conforme

---

## Validation à l'inscription (schéma Zod unique)

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM10 | 🟠 | Email mal formé ou mot de passe < 8 refusé, aucun compte créé | Scénario RM10 (complément smoke) |
| RM11 | 🟢 | Signup sans prénom refusé | aucun smoke, couvert en unitaire |
| RM20 | 🟢 | Prénom d'espaces seulement refusé comme RM11 | aucun smoke, couvert en unitaire |

### RM10 : email mal formé ou mot de passe de 7 caractères (complément smoke)

> ✅ **Ce qu'on vérifie :**
> - Le schéma Zod est bien branché sur `/sign-up/email` : email mal formé et mot de passe de 7 caractères sont refusés en `VALIDATION_ERROR`.
> - Aucun compte n'est créé dans les 2 cas.
> - Se teste en plus de l'unitaire : le test du schéma ne confirme ni le branchement réel sur la route, ni l'absence de compte. Le 8 doit aussi être identique dans la config Better Auth, l'indication affichée et le message d'erreur.

**Préconditions :** les emails `bad-$RUN@x.com` et `court-$RUN@x.com` n'existent pas.

**Étapes :**

1. Email mal formé :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d '{"name":"Marc","email":"pas-un-email","password":"motdepasse8"}'
```

2. Mot de passe de 7 caractères :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Marc\",\"email\":\"court-$RUN@x.com\",\"password\":\"1234567\"}"
```

3. Vérifier qu'aucun compte n'existe pour `court-$RUN@x.com` (un signin doit échouer) :

```bash
curl -i -X POST "$AUTH_URL/sign-in/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"email\":\"court-$RUN@x.com\",\"password\":\"1234567\"}"
```

**Résultat attendu :**

- Étapes 1 et 2 : 4xx (jamais 5xx), corps `{ "code": "VALIDATION_ERROR", "message": "<français>" }`, pas de `Set-Cookie`. Le message de l'étape 2 cite 8 caractères.
- Étape 3 : refus `INVALID_CREDENTIALS` (le compte n'existe pas).
- Variante rapide : refaire l'étape 2 avec 8 caractères (`12345678`) doit être accepté (200). Pas de maximum : un mot de passe de 200 caractères est accepté aussi.

- [ ] RM10 exécuté et conforme

---

## Unicité de l'email

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM9 | 🟠 | Email déjà utilisé : `EMAIL_ALREADY_EXISTS`, aucun compte créé, jamais 500 | Scénario RM9 (complément smoke) |
| RM21 | 🟠 | `" MARC@x.com "` refusé quand `marc@x.com` existe | Scénario RM21 (complément smoke) |

### RM9 : double signup avec le même email (complément smoke)

> ✅ **Ce qu'on vérifie :**
> - Le 2e signup avec le même email répond `EMAIL_ALREADY_EXISTS`, jamais un 500.
> - Il n'y a toujours qu'un seul compte pour cet email en base.
> - Se teste en plus de l'unitaire : la forme d'erreur réelle (Better Auth ou violation `UNIQUE` de Prisma) n'est confirmée que par un vrai appel, et la contrainte `UNIQUE` relève de la base.

**Préconditions :** `dup-$RUN@x.com` n'existe pas.

**Étapes :**

1. Premier signup :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"dup-$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

2. Deuxième signup identique (autre prénom et autre mot de passe, pour voir qu'ils ne comptent pas) :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Autre\",\"email\":\"dup-$RUN@x.com\",\"password\":\"autremotdepasse\"}"
```

3. Compter les comptes en base (`pnpm prisma studio`, ou SQL sur la table des utilisateurs de Better Auth, souvent `"user"`) :

```sql
SELECT count(*) FROM "user" WHERE email = 'dup-<RUN>@x.com';
```

**Résultat attendu :**

- Étape 1 : 200.
- Étape 2 : 4xx (surtout pas 500), corps `{ "code": "EMAIL_ALREADY_EXISTS", "message": "<français>" }`, pas de `Set-Cookie`.
- Étape 3 : `count = 1`. Le compte conserve le prénom `Dup`.
- Un 500 à l'étape 2 signifie que la violation `UNIQUE` n'est pas ré-emballée.

- [ ] RM9 exécuté et conforme

---

### RM21 : `" MARC@x.com "` refusé quand `marc@x.com` existe (complément smoke)

> ✅ **Ce qu'on vérifie :**
> - L'unicité est insensible à la casse et aux espaces : la variante `" MARC@x.com "` est refusée en `EMAIL_ALREADY_EXISTS`.
> - Aucun 2e compte n'est créé.
> - Se teste en plus de l'unitaire : la normalisation (trim + minuscules) est du code à nous, mais que l'email normalisé soit bien celui stocké et comparé par la contrainte `UNIQUE` n'est vérifié par aucun autre test.

**Préconditions :** utiliser un email unique par exécution : `M=marc$RUN@x.com` (en minuscules) n'existe pas.

**Étapes :**

1. Créer le compte en minuscules :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Marc\",\"email\":\"marc$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

2. Retenter avec majuscules et espaces autour :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Marc2\",\"email\":\" MARC$RUN@x.com \",\"password\":\"motdepasse8\"}"
```

3. Contrôle du stockage : en base, l'email du compte est `marc<RUN>@x.com` (minuscules, sans espaces) et il n'y a qu'une ligne.

**Résultat attendu :**

- Étape 1 : 200.
- Étape 2 : 4xx (pas 500), `{ "code": "EMAIL_ALREADY_EXISTS", ... }`.
- Étape 3 : 1 seule ligne, email normalisé.

- [ ] RM21 exécuté et conforme

---

## Erreurs et pannes

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM13 | 🟠 | Signin avec email ou mot de passe faux : `INVALID_CREDENTIALS` | Scénario RM13 (complément smoke) |
| RM18, RM19 | 🟠 | Panne (5xx, timeout) : `INTERNAL_ERROR`, distinct des erreurs métier | Scénario RM18, RM19 (complément smoke) |

### RM13 : mauvais mot de passe, puis email inconnu (complément smoke)

> ✅ **Ce qu'on vérifie :**
> - Mauvais mot de passe et email inconnu donnent le même `INVALID_CREDENTIALS`, sans dire lequel des deux est faux.
> - Aucun cookie de session n'est posé.
> - Se teste en plus de l'unitaire : le mapping est du code à nous, mais la forme d'erreur réelle de Better Auth (mockée en unitaire) n'est confirmée que par un vrai appel.

**Préconditions :** le compte `marc-$RUN@x.com` / `motdepasse8` existe (RM8).

**Étapes :**

1. Bon email, mauvais mot de passe :

```bash
curl -i -X POST "$AUTH_URL/sign-in/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"email\":\"marc-$RUN@x.com\",\"password\":\"mauvaismdp123\"}"
```

2. Email inconnu :

```bash
curl -i -X POST "$AUTH_URL/sign-in/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"email\":\"inconnu-$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

**Résultat attendu :**

- Les 2 étapes : 4xx (probablement 401, le contrat ne le fige pas), corps `{ "code": "INVALID_CREDENTIALS", "message": "<français>" }`, **identique** dans les 2 cas, pas de `Set-Cookie`.
- Si le code ou le message diffère entre les 2 cas, l'application révèle lequel est faux : échec.

- [ ] RM13 exécuté et conforme

---

### RM18, RM19 : base injoignable (complément smoke)

> ✅ **Ce qu'on vérifie :**
> - Une panne réelle (base injoignable) ressort en `INTERNAL_ERROR`, distinct de `EMAIL_ALREADY_EXISTS` / `INVALID_CREDENTIALS` / `VALIDATION_ERROR`.
> - L'erreur n'est jamais brute (pas de stack, pas de message Prisma ou Better Auth dans le corps) et le message est en français.
> - Se teste en plus de l'unitaire : le repli est du code à nous, mais les formes réelles d'une panne Prisma ou d'un timeout ne sont confirmées par aucun autre test.

**Préconditions :** arrêter le serveur, puis le relancer avec une `DATABASE_URL` qui pointe vers un hôte injoignable, sans toucher au `.env` :

```bash
DATABASE_URL="postgresql://user:password@localhost:1/db?sslmode=disable" pnpm dev
```

(Si le serveur refuse de démarrer sans base, le signaler : le scénario devient « couper la connexion Neon » à la place. Remettre ensuite la vraie `DATABASE_URL`.)

**Étapes :**

1. Signin pendant la panne :

```bash
curl -i -X POST "$AUTH_URL/sign-in/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d '{"email":"marc@x.com","password":"motdepasse8"}'
```

2. Signup pendant la panne (même vérification sur une 2e route) :

```bash
curl -i -X POST "$AUTH_URL/sign-up/email" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Marc\",\"email\":\"panne-$RUN@x.com\",\"password\":\"motdepasse8\"}"
```

**Résultat attendu :**

- Les 2 étapes : 500, corps `{ "code": "INTERNAL_ERROR", "message": "<français>" }`, rien d'autre dans le corps, pas de `Set-Cookie`.
- Après le scénario : relancer le serveur avec la vraie `DATABASE_URL`.

- [ ] RM18, RM19 exécuté et conforme

---

## Route protégée

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM2 | 🟢 | Route protégée sans session : 401 | aucun smoke, couvert en unitaire |
