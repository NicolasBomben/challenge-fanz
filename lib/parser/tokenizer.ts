/**
 * Tokenizer: convierte un string de comando en un array de tokens.
 *
 * ¿Por qué no usar simplemente input.split(" ")?
 * Porque fallaría con valores entre comillas:
 *   'fanz events create --name "Fiesta Demo"'
 *   split(" ") → ["--name", "\"Fiesta", "Demo\""]  ← MAL, partió el nombre
 *   tokenize() → ["--name", "Fiesta Demo"]          ← BIEN, respeta las comillas
 *
 * El tokenizer recorre el string caracter por caracter y tiene 3 estados:
 *   1. Normal: acumula caracteres hasta encontrar un espacio
 *   2. Dentro de comillas dobles ("..."): acumula todo hasta el cierre
 *   3. Dentro de comillas simples ('...'): igual que dobles
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];

  // El token que estamos construyendo caracter a caracter
  let current = "";

  // Si estamos dentro de comillas, guardamos qué tipo de comilla abrió
  // null = no estamos dentro de comillas
  let quoteChar: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quoteChar) {
      // ESTADO: dentro de comillas
      // Buscamos el cierre (el mismo tipo de comilla que abrió)
      if (char === quoteChar) {
        // Encontramos el cierre → salimos del modo comillas
        // No agregamos la comilla al token (la descartamos)
        quoteChar = null;
      } else {
        // Cualquier otro caracter (incluidos espacios) se acumula
        current += char;
      }
    } else if (char === '"' || char === "'") {
      // ESTADO: encontramos apertura de comillas
      // Entramos al modo comillas, no agregamos la comilla al token
      quoteChar = char;
    } else if (char === " " || char === "\t") {
      // ESTADO: espacio fuera de comillas → separa tokens
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      // Si hay espacios consecutivos, simplemente los saltamos
      // (current está vacío, así que no se pushea nada)
    } else {
      // ESTADO: caracter normal → lo acumulamos en el token actual
      current += char;
    }
  }

  // El último token no termina con espacio, así que lo agregamos manualmente
  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}
