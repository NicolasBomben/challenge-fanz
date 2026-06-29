/**
 * Mapa de permisos: define qué operaciones son de lectura y cuáles de escritura.
 *
 * ¿Por qué importa separar esto?
 *   - El token "mock_readonly" solo puede ejecutar lecturas
 *   - El token "mock_admin" puede ejecutar todo
 *   - Esto es un guardrail: si un agente de IA usa el token de solo lectura,
 *     no puede hacer daño accidental (crear, borrar, modificar datos)
 *
 * ¿Cómo funciona?
 *   - Cada recurso (events, tickets, etc.) tiene un set de acciones de lectura
 *   - Todo lo que NO esté en el set de lectura se considera escritura
 *   - Así, si agregamos una acción nueva y nos olvidamos de clasificarla,
 *     por defecto requiere admin → fail-safe (seguro por defecto)
 */

const READ_ACTIONS: Record<string, Set<string>> = {
  events: new Set(["list", "get"]),
  dates: new Set(["list", "get"]),
  tickets: new Set(["list", "get"]),
  discounts: new Set(["list", "get"]),
  sales: new Set(["list", "get", "stats"]),
  buyers: new Set(["list", "get"]),
  audit: new Set(["list"]),
};

/**
 * Determina si un comando es de solo lectura.
 * Si el recurso no existe en el mapa, se considera escritura (fail-safe).
 */
export function isReadOnly(resource: string, action: string): boolean {
  const actions = READ_ACTIONS[resource];
  if (!actions) return false;
  return actions.has(action);
}

/**
 * Determina si un comando es destructivo (delete o acciones que borran datos).
 * Los comandos destructivos requieren --yes o --dry-run como guardrail extra.
 */
export function isDestructive(action: string): boolean {
  return action === "delete";
}

/**
 * Determina si un comando es de escritura (create, update, delete, o acciones especiales).
 * Es simplemente lo opuesto a isReadOnly.
 */
export function isWriteAction(resource: string, action: string): boolean {
  return !isReadOnly(resource, action);
}
