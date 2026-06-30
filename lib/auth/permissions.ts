//Mapa de permisos: define qué operaciones son de lectura y cuáles de escritura.
const READ_ACTIONS: Record<string, Set<string>> = {
  events: new Set(["list", "get"]),
  dates: new Set(["list", "get"]),
  tickets: new Set(["list", "get"]),
  discounts: new Set(["list", "get"]),
  sales: new Set(["list", "get", "stats"]),
  buyers: new Set(["list", "get"]),
  audit: new Set(["list"]),
};

//Determina si un comando es de solo lectura.
export function isReadOnly(resource: string, action: string): boolean {
  const actions = READ_ACTIONS[resource];
  if (!actions) return false;
  return actions.has(action);
}

//Determina si un comando es destructivo (delete o acciones que borran datos).
export function isDestructive(action: string): boolean {
  return action === "delete";
}

//Determina si un comando es de escritura (create, update, delete, o acciones especiales).
export function isWriteAction(resource: string, action: string): boolean {
  return !isReadOnly(resource, action);
}
