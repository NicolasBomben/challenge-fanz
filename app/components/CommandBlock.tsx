"use client";

import { useState } from "react";

/**
 * Bloque de comando copiable. Muestra un comando en monoespaciado con un botón
 * "copiar" que lo pasa al portapapeles. Es client-side porque usa el clipboard
 * y estado local para el feedback ("copiado").
 */
export function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Si el navegador bloquea el clipboard, no rompemos nada.
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2">
      <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-neutral-200">
        <span className="select-none text-green-500">$ </span>
        {command}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
        aria-label="Copiar comando"
      >
        {copied ? "✓ copiado" : "copiar"}
      </button>
    </div>
  );
}
