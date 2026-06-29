#!/usr/bin/env bash
#
# Helper para probar el CLI contra el dev server local sin escribir curl a mano.
#
# Uso:
#   ./scripts/fanz.sh "events list"                  → usa el token por defecto (mock_admin)
#   ./scripts/fanz.sh "events list" mock_readonly    → especifica el token
#   TOKEN=mock_readonly ./scripts/fanz.sh "events list"
#
# Requiere el dev server corriendo: npm run dev
#
# El output se pretty-printea con python3 si está disponible.

set -euo pipefail

COMMAND="${1:-}"
TOKEN="${2:-${TOKEN:-mock_admin}}"
URL="${FANZ_URL:-http://localhost:3000}/api/cli"

if [ -z "$COMMAND" ]; then
  echo "Uso: ./scripts/fanz.sh \"<comando>\" [token]"
  echo "Ejemplo: ./scripts/fanz.sh \"events list\" mock_admin"
  exit 1
fi

# Armamos el body JSON de forma segura usando python para escapar comillas
BODY=$(python3 -c "import json,sys; print(json.dumps({'command': sys.argv[1], 'token': sys.argv[2]}))" "$COMMAND" "$TOKEN")

RESPONSE=$(curl -s -X POST "$URL" -H "Content-Type: application/json" -d "$BODY")

# Pretty-print si python3 está disponible, si no, output crudo
if command -v python3 >/dev/null 2>&1; then
  echo "$RESPONSE" | python3 -m json.tool
else
  echo "$RESPONSE"
fi
