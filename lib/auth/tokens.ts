import type { TokenInfo } from "@/lib/types";

/**
 * Registro de tokens mock.
 *
 * En un sistema real, esto sería una tabla en base de datos y los tokens
 * serían JWTs o API keys generados dinámicamente. Acá usamos un Map
 * hardcodeado porque el challenge pide autenticación mock.
 *
 * Tokens disponibles:
 *   - mock_admin    → puede leer y escribir (crear, editar, borrar)
 *   - mock_readonly → solo puede leer (listar, consultar)
 *   - mock_invalid  → existe para demostrar el manejo de errores
 *                      (lo rechazamos a propósito en la validación)
 */

const TOKEN_REGISTRY = new Map<string, TokenInfo>([
  [
    "mock_admin",
    { token: "mock_admin", role: "admin", accountId: "ACC_1" },
  ],
  [
    "mock_readonly",
    { token: "mock_readonly", role: "readonly", accountId: "ACC_1" },
  ],
  // mock_invalid NO está en el registro → getTokenInfo devuelve undefined
  // Eso es intencional: simula un token expirado o inválido
]);

/**
 * Busca la info de un token. Devuelve undefined si no existe o es inválido.
 */
export function getTokenInfo(token: string): TokenInfo | undefined {
  return TOKEN_REGISTRY.get(token);
}
