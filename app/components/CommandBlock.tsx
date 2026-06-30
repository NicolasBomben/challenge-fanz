"use client";

import { useState } from "react";

export function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("No se pudo copiar al portapapeles:", err);
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
