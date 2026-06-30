import type { TokenInfo } from "@/lib/types";
import { getTokenInfo } from "./tokens";
import { isWriteAction } from "./permissions";

export type AuthResult =
  | { authorized: true; tokenInfo: TokenInfo }
  | { authorized: false; error: string };

export function authorize(
  token: string | undefined,
  resource: string,
  action: string,
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
