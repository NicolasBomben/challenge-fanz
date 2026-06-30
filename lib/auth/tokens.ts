import type { TokenInfo } from "@/lib/types";

//Registro de tokens mock.
const TOKEN_REGISTRY = new Map<string, TokenInfo>([
  ["mock_admin", { token: "mock_admin", role: "admin", accountId: "ACC_1" }],
  [
    "mock_readonly",
    { token: "mock_readonly", role: "readonly", accountId: "ACC_1" },
  ],
]);

//Busca la info de un token. Devuelve undefined si no existe o es inválido.
export function getTokenInfo(token: string): TokenInfo | undefined {
  return TOKEN_REGISTRY.get(token);
}
