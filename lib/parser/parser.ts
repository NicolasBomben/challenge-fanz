import type { ParsedCommand } from "@/lib/types";
import { tokenize } from "./tokenizer";

/**
 * Parser: toma el string crudo del CLI y devuelve un ParsedCommand estructurado.
 *
 * Anatomía de un comando:
 *   fanz events create EVT_1 --name "Fiesta" --dry-run
 *   ──── ────── ────── ───── ────────────── ─────────
 *   (1)   (2)    (3)   (4)      (5)           (6)
 *
 *   (1) Prefijo "fanz" → se descarta (opcional, por comodidad del usuario)
 *   (2) Resource → "events" (sobre qué entidad opera)
 *   (3) Action → "create" (qué operación hacer)
 *   (4) Positional → "EVT_1" (argumento sin flag, identificado por posición)
 *   (5) Flag con valor → --name "Fiesta" (clave-valor)
 *   (6) Flag booleano → --dry-run (solo presencia, sin valor)
 *
 * ¿Cómo distinguimos un flag con valor de uno booleano?
 *   - Si después de --name viene otro token que NO empieza con --, es el valor
 *   - Si después de --dry-run viene otro -- o no hay nada más, es booleano (true)
 *
 * ¿Cómo distinguimos un positional de un resource/action?
 *   - Los primeros 2 tokens no-flag son siempre resource y action
 *   - A partir del 3ro, todo token que no empieza con -- es un positional
 */
export function parse(input: string): ParsedCommand {
  const tokens = tokenize(input.trim());

  // Separamos los tokens en dos grupos:
  //   nonFlags: palabras normales (resource, action, positionals)
  //   flags: pares clave-valor o booleanos
  const nonFlags: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.startsWith("--")) {
      // Es un flag: sacamos el nombre (sin el --)
      const flagName = token.slice(2);

      // Miramos el siguiente token para decidir si es booleano o tiene valor
      const nextToken = tokens[i + 1];

      if (nextToken !== undefined && !nextToken.startsWith("--")) {
        // El siguiente token no es un flag → es el valor de este flag
        // Ejemplo: --name "Fiesta" → flags.name = "Fiesta"
        flags[flagName] = nextToken;
        i += 2; // Saltamos 2 tokens (flag + valor)
      } else {
        // No hay siguiente, o el siguiente es otro flag → booleano
        // Ejemplo: --dry-run --json → flags["dry-run"] = true, flags.json = true
        flags[flagName] = true;
        i += 1;
      }
    } else {
      // No empieza con --: es un token posicional (resource, action, o positional)
      nonFlags.push(token);
      i += 1;
    }
  }

  // Si el primer token es "fanz", lo descartamos (es opcional)
  if (nonFlags[0]?.toLowerCase() === "fanz") {
    nonFlags.shift();
  }

  // Los primeros 2 nonFlags son resource y action
  // Todo lo demás son positionals
  // Si faltan, quedan como string vacío (se maneja después con errores)
  const resource = nonFlags[0] ?? "";
  const action = nonFlags[1] ?? "";
  const positionals = nonFlags.slice(2);

  return { resource, action, positionals, flags };
}
