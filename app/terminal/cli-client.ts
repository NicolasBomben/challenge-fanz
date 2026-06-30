import type { CLIResponse } from "@/lib/types";

//Cliente del CLI para el browser. Manda el comando al endpoint /api/cli junto
//con el token de sesión (si hay), y devuelve el CLIResponse.

export async function runCommand(
  command: string,
  token?: string,
): Promise<CLIResponse> {
  try {
    const res = await fetch("/api/cli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, token }),
    });
    return (await res.json()) as CLIResponse;
  } catch (err) {
    return {
      ok: false,
      command,
      error: `Network error: ${err instanceof Error ? err.message : String(err)}. Is the server running?`,
    };
  }
}
