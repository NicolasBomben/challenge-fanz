import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/commands";
import type { CLIResponse } from "@/lib/types";

/**
 * POST /api/cli
 *
 * Único endpoint del CLI. Recibe un comando crudo y devuelve un CLIResponse.
 *
 * Request body:
 *   { "command": "events list --json", "token": "mock_admin" }
 *     - command: string crudo del comando (requerido)
 *     - token: token de sesión (opcional; el flag --token del comando tiene prioridad)
 *
 * Response: siempre un CLIResponse JSON estable.
 *   { "ok": true, "command": "events list", "data": [...], "message": "..." }
 *
 * Decisión de diseño: devolvemos HTTP 200 incluso para errores de negocio o auth.
 * El campo "ok" del body es la única fuente de verdad sobre éxito/fallo. Esto le
 * da a los agentes de IA un contrato predecible: siempre parsean el mismo JSON,
 * sin depender de mapear códigos HTTP. Solo un request HTTP malformado (body
 * inválido) devuelve un status != 200.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        command: "",
        error: 'Invalid request body. Expected JSON: { "command": "...", "token": "..." }',
      } satisfies CLIResponse,
      { status: 400 }
    );
  }

  // Validamos que el body tenga la forma esperada
  if (typeof body !== "object" || body === null || !("command" in body)) {
    return NextResponse.json(
      {
        ok: false,
        command: "",
        error: 'Missing "command" field. Expected JSON: { "command": "...", "token": "..." }',
      } satisfies CLIResponse,
      { status: 400 }
    );
  }

  const { command, token } = body as { command: unknown; token?: unknown };

  if (typeof command !== "string") {
    return NextResponse.json(
      {
        ok: false,
        command: "",
        error: '"command" must be a string.',
      } satisfies CLIResponse,
      { status: 400 }
    );
  }

  const sessionToken = typeof token === "string" ? token : undefined;
  const result = execute(command, sessionToken);

  return NextResponse.json(result, { status: 200 });
}
