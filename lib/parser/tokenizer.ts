//Tokenizer: convierte un string de comando en un array de tokens.
export function tokenize(input: string): string[] {
  const tokens: string[] = [];

  let current = "";

  let quoteChar: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quoteChar) {
      if (char === quoteChar) {
        quoteChar = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quoteChar = char;
    } else if (char === " " || char === "\t") {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}
