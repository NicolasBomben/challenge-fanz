import type { CommandResult } from "../types";

/**
 * Helpers de guardrails. Centralizan las dos protecciones que pide el challenge
 * para acciones de escritura/destructivas:
 *
 *   1. --dry-run: simular la acción sin ejecutarla (preview)
 *   2. --yes:     confirmación obligatoria antes de borrar
 *
 * Al vivir acá, todos los comandos los aplican de la misma forma → comportamiento
 * predecible para los agentes de IA (bajo riesgo de acciones accidentales).
 */

/** ¿El usuario pidió --dry-run? (simular sin ejecutar) */
export function wantsDryRun(flags: Record<string, string | boolean>): boolean {
  return flags["dry-run"] === true;
}

/** ¿El usuario confirmó con --yes? (requerido para borrar) */
export function isConfirmed(flags: Record<string, string | boolean>): boolean {
  return flags["yes"] === true;
}

/**
 * Construye una respuesta de dry-run (preview). Marca dryRun: true para que el
 * caller (terminal/agente) sepa que NADA se modificó.
 *
 * @param action descripción legible de lo que se haría, ej: "create event"
 * @param preview el objeto/datos que se crearían o modificarían
 */
export function dryRunResult(action: string, preview: unknown): CommandResult {
  return {
    ok: true,
    dryRun: true,
    data: preview,
    message: `[dry-run] Would ${action}. Nothing was changed. Re-run without --dry-run to apply.`,
  };
}

/**
 * Guardrail para borrados: exige --yes salvo que sea un --dry-run.
 *
 * Devuelve null si está OK para proceder, o un CommandResult de error accionable
 * si falta la confirmación. El handler hace:
 *
 *   const blocked = requireConfirmation(flags, "event EVT_1");
 *   if (blocked) return blocked;
 *   // ... proceder con el borrado
 */
export function requireConfirmation(
  flags: Record<string, string | boolean>,
  target: string
): CommandResult | null {
  if (isConfirmed(flags) || wantsDryRun(flags)) {
    return null;
  }

  return {
    ok: false,
    error: `This will permanently delete ${target}. Add --yes to confirm, or --dry-run to preview what would be deleted.`,
  };
}
