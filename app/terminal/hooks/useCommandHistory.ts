import { useMemo, useRef } from "react";

//Hook de historial de comandos. Encapsula el array de comandos y el índice de
//navegación con flechas.
export function useCommandHistory() {
  const items = useRef<string[]>([]);
  const idx = useRef(-1); // -1 = línea nueva (no estamos navegando)

  // useMemo con deps vacías el objeto se crea una sola vez (identidad estable)
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
        idx.current =
          idx.current === -1 ? h.length - 1 : Math.max(0, idx.current - 1);
        return h[idx.current];
      },

      next(): string | null {
        const h = items.current;
        if (idx.current === -1) return null;
        idx.current += 1;
        if (idx.current >= h.length) {
          idx.current = -1;
          return "";
        }
        return h[idx.current];
      },
    }),
    [],
  );
}
