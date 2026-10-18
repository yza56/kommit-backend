#!/usr/bin/env bash
# Hook Stop : lance le lint quand Claude a fini de répondre.
# Si le lint échoue, le code de sortie 2 renvoie l'erreur à Claude, qui corrige.

input=$(cat)

# Déjà relancé par ce hook : on laisse passer, sinon boucle infinie si l'erreur persiste.
if echo "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

if ! output=$(pnpm lint 2>&1); then
  echo "$output" >&2
  exit 2
fi
