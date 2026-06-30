import Link from "next/link";
import Terminal from "./Terminal";

export const metadata = {
  title: "Fanz CLI — Terminal",
  description: "Web terminal para operar la ticketera mock de Fanz.",
};

export default function TerminalPage() {
  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-green-400">fanz</span>
          <span className="text-sm text-neutral-400">CLI · web terminal</span>
        </div>
        <Link href="/" className="text-sm text-neutral-400 underline-offset-4 hover:text-neutral-100 hover:underline">
          ← Instructivo
        </Link>
      </header>

      <main className="flex-1 overflow-hidden p-2">
        <Terminal />
      </main>
    </div>
  );
}
