#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# run-subagents.sh — Invoca los subagentes de Claude Code localmente
# Lab 14: Push y olvidate — subagentes de testing y code review
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo "Uso: $0 <subagente> [opciones]"
    echo ""
    echo "Subagentes disponibles:"
    echo "  test-runner     Ejecuta todas las suites de testing"
    echo "  code-reviewer   Revisa el diff de los últimos cambios"
    echo ""
    echo "Opciones:"
    echo "  --diff <ref>    Ref para code-reviewer (default: HEAD~3)"
    echo "  --help          Muestra esta ayuda"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

SUBAGENT="$1"
shift

case "$SUBAGENT" in
    test-runner)
        echo -e "${YELLOW}🧪 Ejecutando subagente test-runner...${NC}"
        echo ""

        echo -e "${GREEN}▸ Unit tests (Vitest)${NC}"
        npm run test || { echo -e "${RED}❌ Unit tests fallaron${NC}"; exit 1; }
        echo ""

        echo -e "${GREEN}▸ E2E tests (Playwright)${NC}"
        npm run test:e2e || { echo -e "${RED}❌ E2E tests fallaron${NC}"; exit 1; }
        echo ""

        echo -e "${GREEN}TESTS_PASS — Todas las suites pasaron correctamente.${NC}"
        ;;

    code-reviewer)
        DIFF_REF="HEAD~3"
        while [ $# -gt 0 ]; do
            case "$1" in
                --diff) DIFF_REF="$2"; shift 2 ;;
                *) echo "Opción desconocida: $1"; usage ;;
            esac
        done

        echo -e "${YELLOW}📋 Ejecutando subagente code-reviewer sobre git diff $DIFF_REF...${NC}"
        echo ""

        echo "=== Archivos modificados ==="
        git diff --name-only "$DIFF_REF"
        echo ""

        echo "=== Verificando secrets expuestos ==="
        if git diff "$DIFF_REF" | grep -iE '(api_key|secret|password|token)\s*[:=]\s*["'"'"'][A-Za-z0-9]'; then
            echo -e "${RED}❌ Posible secret expuesto detectado${NC}"
            exit 1
        fi

        echo "=== Verificando imports de admin en client components ==="
        CHANGED_COMPONENTS=$(git diff --name-only "$DIFF_REF" | grep 'src/components/.*\.tsx$' || true)
        for f in $CHANGED_COMPONENTS; do
            if grep -q "from.*supabase/admin" "$f" 2>/dev/null; then
                echo -e "${RED}❌ $f importa admin.ts — no debe usarse en componentes client${NC}"
                exit 1
            fi
        done

        echo ""
        echo -e "${GREEN}✅ Code review completado — sin hallazgos blocking${NC}"
        ;;

    *)
        echo -e "${RED}Subagente desconocido: $SUBAGENT${NC}"
        usage
        ;;
esac
