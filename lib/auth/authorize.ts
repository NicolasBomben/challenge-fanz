import type { TokenInfo } from "@/lib/types";
import { getTokenInfo } from "./tokens";
import { isWriteAction } from "./permissions";

/**
 * Resultado de la autorización.
 *
 * ¿Por qué no lanzar un error directamente?
 *   - Porque el caller (route handler) necesita saber QUÉ falló para dar
 *     un mensaje de error accionable al usuario. No es lo mismo:
 *       "Token inválido" → el usuario sabe que tiene que cambiar el token
 *       "Permiso denegado: mock_readonly no puede crear eventos"
 *         → el usuario sabe que necesita mock_admin
 *
 *   - También llevamos el tokenInfo cuando la auth pasa, porque lo necesitamos
 *     para el audit log (registrar quién ejecutó qué).
 */
export type AuthResult =
  | { authorized: true; tokenInfo: TokenInfo }
  | { authorized: false; error: string };

/**
 * Valida un token y verifica que tenga permisos para ejecutar el comando.
 *
 * Flujo:
 *   1. ¿Hay token? → si no, error
 *   2. ¿El token existe en el registro? → si no, error
 *   3. ¿El comando es de escritura Y el token es readonly? → error
 *   4. Todo OK → autorizado
 */
export function authorize(
  token: string | undefined,
  resource: string,
  action: string
): AuthResult {
  // 1. ¿Hay token?
  if (!token) {
    return {
      authorized: false,
      error:
        'No token provided. Use "fanz login --token <token>" or pass --token with each command. Available tokens: mock_admin, mock_readonly.',
    };
  }

  // 2. ¿El token es válido?
  const tokenInfo = getTokenInfo(token);
  if (!tokenInfo) {
    return {
      authorized: false,
      error: `Invalid token "${token}". Available tokens: mock_admin (read+write), mock_readonly (read only).`,
    };
  }

  // 3. ¿Tiene permisos para esta operación?
  if (tokenInfo.role === "readonly" && isWriteAction(resource, action)) {
    return {
      authorized: false,
      error: `Permission denied: token "mock_readonly" cannot execute "${resource} ${action}". This action requires write access. Use token "mock_admin" instead.`,
    };
  }

  // 4. Autorizado
  return { authorized: true, tokenInfo };
}
