import { useMemo, useRef } from "react";

/**
 * Hook de historial de comandos. Encapsula el array de comandos y el índice de
 * navegación con flechas. Lógica pura sobre refs (no toca el DOM ni xterm), así
 * el componente solo pide "anterior"/"siguiente" sin saber de índices.
 *
 * Devuelve un objeto ESTABLE (mismo identidad entre renders) para poder usarlo
 * como dependencia de useEffect sin re-ejecutarlo.
 *
 *   record(cmd)  → guarda un comando ejecutado y resetea la navegación
 *   previous()   → comando anterior, o null si no hay historial
 *   next()       → comando siguiente; "" al volver a la línea nueva; null si no aplica
 */
export function useCommandHistory() {
  const items = useRef<string[]>([]);
  const idx = useRef(-1); // -1 = línea nueva (no estamos navegando)

  // useMemo con deps vacías → el objeto se crea una sola vez (identidad estable)
  // sin leer ningún ref durante el render. Los métodos acceden a items/idx solo
  // cuando se los llama (en handlers), no durante el render.
  return useMemo(
    () => ({
      record(cmd: string) {
        items.current.push(cmd);
        idx.current = -1;
      },

      previous(): string | null {
        const h = items.current;
        if (h.length === 0) return null;
        idx.current = idx.current === -1 ? h.length - 1 : Math.max(0, idx.current - 1);
        return h[idx.current];
      },

      next(): string | null {
        const h = items.current;
        if (idx.current === -1) return null;
        idx.current += 1;
        if (idx.current >= h.length) {
          idx.current = -1;
          return ""; // volvimos a la línea nueva, vacía
        }
        return h[idx.current];
      },
    }),
    []
  );
}
