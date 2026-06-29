import type { TokenRole } from "./enums";

export interface TokenInfo {
  token: string;
  role: TokenRole;
  accountId: string;
}
