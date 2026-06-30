import type { CLIResponse } from "@/lib/types";
import { RESET, GREEN, RED, YELLOW, DIM, BOLD } from "./ansi";

// Texto de bienvenida que se muestra al abrir la terminal.
export function banner(): string {
  return (
    `${BOLD}${GREEN}Fanz CLI${RESET} — ticketing para personas y agentes\n` +
    `${DIM}Empezá con:${RESET} login --token mock_admin   ${DIM}|${RESET}   help   ${DIM}|${RESET}   clear\n` +
    `${DIM}Tokens: mock_admin (lectura+escritura), mock_readonly (solo lectura)${RESET}`
  );
}


//Convierte un CLIResponse en el texto a mostrar:

export function renderResponse(res: CLIResponse): string {
  if (!res.ok) {
    return `${RED}✗ ${res.error ?? "Unknown error"}${RESET}`;
  }

  const lines: string[] = [];
  if (res.message) {
    const color = res.dryRun ? YELLOW : GREEN;
    lines.push(`${color}${res.message}${RESET}`);
  }
  if (res.data !== undefined) {
    lines.push(`${DIM}${JSON.stringify(res.data, null, 2)}${RESET}`);
  }
  return lines.join("\n");
}
