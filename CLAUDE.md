# kommit-backend

Backend de Kommit : une API Node.js / TypeScript (Express).

## Arborescence

```
kommit-backend/
├── .claude/
│   ├── agents/          # agents de test (planner, writers) et code-reviewer
│   ├── hooks/
│   │   └── lint.sh
│   ├── rules/
│   │   ├── architecture-backend.md
│   │   ├── files.md
│   │   ├── imports.md
│   │   ├── perimetre-backend.md
│   │   ├── pnpm.md
│   │   └── tests-arrange-act-assert.md
│   ├── skills/          # skills du workflow ticket (start-ticket, write-tests…)
│   └── settings.json
├── .vscode/
│   └── settings.json
├── docs/
│   ├── TECH.md
│   ├── testing-strategy.md
│   └── workflow-ticket-backend.md
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── dbHealthController.ts
│   │   ├── healthController.ts
│   │   └── rootController.ts
│   ├── middlewares/
│   │   ├── corsMiddleware.ts
│   │   └── requireSession/
│   │       ├── requireSession.ts
│   │       └── requireSession.test.ts
│   ├── repositories/
│   │   ├── auth.ts
│   │   ├── dbHealthRepository.ts
│   │   ├── generated/       # client Prisma généré (ignoré par git)
│   │   └── prisma.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── dbHealthRoutes.ts
│   │   ├── healthRoutes.ts
│   │   ├── index.ts
│   │   └── rootRoutes.ts
│   ├── services/
│   │   ├── auth/
│   │   │   ├── authErrors/
│   │   │   │   ├── authErrors.ts
│   │   │   │   └── authErrors.test.ts
│   │   │   └── authValidation/
│   │   │       ├── authValidation.ts
│   │   │       └── authValidation.test.ts
│   │   ├── dbHealth/
│   │   │   └── dbHealthService.ts
│   │   ├── health/
│   │   │   └── healthService.ts
│   │   └── root/
│   │       └── rootService.ts
│   ├── types/
│   │   └── apiContract.ts
│   ├── app.ts
│   └── index.ts
├── testing/
│   ├── inventaire-KOM-06.md
│   └── smokes-KOM-06.md
├── .env.example
├── .gitignore
├── CLAUDE.md
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Mets à jour ce fichier (surtout l'arborescence) à chaque modification du projet.
