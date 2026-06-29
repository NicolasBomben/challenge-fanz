"use client";

import { useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { useCliTerminal } from "./hooks/useCliTerminal";

/**
 * Web terminal del Fanz CLI. Componente de vista: monta el contenedor y delega
 * toda la lógica al hook useCliTerminal (lifecycle de xterm + REPL).
 */
export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  useCliTerminal(containerRef);
  return <div ref={containerRef} className="h-full w-full" />;
}
