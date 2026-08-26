# CHANGELOG — Lab 14: Push y olvidate

## [2026-08-26] — CI/CD con subagentes de testing y code review

### Agregado

#### Subagentes (`.claude/agents/`)
- **test-runner.md** — Subagente de testing que ejecuta Vitest (unitarias) y Playwright (E2E), analiza fallos y reporta veredicto `TESTS_PASS` / `TESTS_FAIL`.
- **code-reviewer.md** — Subagente de solo lectura que revisa el diff de un PR contra checklist de seguridad, a11y, SEO, convenciones y testing. Reporta hallazgos por severidad (blocking/important/nit).

#### CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Gate 1 — Lint & Typecheck:** ESLint + `tsc --noEmit` como prerequisito.
- **Gate 2 — Test Runner:** Ejecuta `npm run test` (Vitest) y `npm run test:e2e` (Playwright) como gate obligatorio.
- **Gate 3 — Code Review:** Analiza el diff del PR buscando secrets expuestos, imports indebidos de admin.ts, y console.logs no deseados. Solo corre en PRs.
- **Deploy a Vercel:** Despliegue automático a producción (`--prod`) en push a `main`, solo si todos los gates pasan.
- **Deploy Preview:** Despliegue preview automático en PRs.

#### Scripts
- `scripts/run-subagents.sh` — Script helper para invocar los subagentes localmente sin Claude Code.

### Modificado
- `.gitignore` — Excluye `e2e/` y `test-results/` del repositorio (tests de integración no se suben a GitHub).

### Configuración requerida (GitHub Secrets)
| Secret | Descripción |
|--------|-------------|
| `VERCEL_TOKEN` | Token de Vercel para deploys automáticos. |

### Uso local de subagentes
```bash
# Ejecutar subagente test-runner
./scripts/run-subagents.sh test-runner

# Ejecutar subagente code-reviewer (últimos 3 commits)
./scripts/run-subagents.sh code-reviewer --diff HEAD~3
```

### Uso con Claude Code (si se tiene acceso)
```bash
# Invocar test-runner via Claude Code
claude -p "Usa el subagente test-runner para validar el estado actual del repo."

# Invocar code-reviewer via Claude Code
claude -p "Usa el subagente code-reviewer para revisar los últimos cambios (git diff HEAD~3)."
```

### Notas técnicas
- El pipeline **no utiliza AWS Bedrock ni Claude Code** — ejecuta tests y lint directamente con Node.js.
- Los subagentes `.claude/agents/` están diseñados para uso local con Claude Code pero el CI los implementa como verificaciones shell equivalentes.
- Playwright se instala automáticamente en CI con `npx playwright install --with-deps chromium`.
