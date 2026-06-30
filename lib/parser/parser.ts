import type { ParsedCommand } from "@/lib/types";
import { tokenize } from "./tokenizer";

//Parser: toma el string crudo del CLI y devuelve un ParsedCommand estructurado.
export function parse(input: string): ParsedCommand {
  const tokens = tokenize(input.trim());

  const nonFlags: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.startsWith("--")) {
      const flagName = token.slice(2);

      const nextToken = tokens[i + 1];

      if (nextToken !== undefined && !nextToken.startsWith("--")) {
        flags[flagName] = nextToken;
        i += 2;
      } else {
        flags[flagName] = true;
        i += 1;
      }
    } else {
      nonFlags.push(token);
      i += 1;
    }
  }

  if (nonFlags[0]?.toLowerCase() === "fanz") {
    nonFlags.shift();
  }

  const resource = nonFlags[0] ?? "";
  const action = nonFlags[1] ?? "";
  const positionals = nonFlags.slice(2);

  return { resource, action, positionals, flags };
}
