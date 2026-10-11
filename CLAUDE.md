# kommit-backend

Backend de Kommit : une API Node.js / TypeScript (Express).

## Arborescence

```
kommit-backend/
├── .claude/
│   ├── rules/
│   │   ├── architecture-backend.md
│   │   ├── files.md
│   │   ├── imports.md
│   │   ├── perimetre-backend.md
│   │   ├── pnpm.md
│   │   └── tests-arrange-act-assert.md
│   └── skills/
│       └── .gitkeep
├── .vscode/
│   └── settings.json
├── docs/
│   └── TECH.md
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── healthController.ts
│   │   └── rootController.ts
│   ├── routes/
│   │   ├── healthRoutes.ts
│   │   ├── index.ts
│   │   └── rootRoutes.ts
│   ├── services/
│   │   ├── health/
│   │   │   └── healthService.ts
│   │   └── root/
│   │       └── rootService.ts
│   ├── app.ts
│   └── index.ts
├── .gitignore
├── CLAUDE.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.json
```

Mets à jour ce fichier (surtout l'arborescence) à chaque modification du projet.
