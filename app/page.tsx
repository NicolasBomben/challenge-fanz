import Link from "next/link";
import { CommandBlock } from "./components/CommandBlock";

// Flujo end-to-end: crear un evento desde cero, agregarle fecha/tickets/descuento,
// consultar ventas y ejecutar una acción. Los IDs (EVT_4, DATE_7) son los que
// devuelve cada comando sobre el estado inicial (el seed llega hasta EVT_3 / DATE_6).
const QUICKSTART: string[] = [
  "login --token mock_admin",
  'events create --name "Mi Festival" --location "Buenos Aires" --status published',
  'dates create --event EVT_4 --datetime 2026-12-20T21:00:00Z --venue "Movistar Arena"',
  "tickets create --date DATE_7 --name General --price 18000 --stock 1000",
  "discounts create --event EVT_4 --code LANZAMIENTO --percent 15",
  "sales stats --event EVT_4",
  "actions pause --event EVT_4",
];

// Ejemplos de solo lectura y de guardrails.
const READONLY: string[] = [
  "login --token mock_readonly",
  "events list",
  "sales stats --event EVT_1",
];

const GUARDRAILS: string[] = [
  "events delete EVT_1 --dry-run",
  "events delete EVT_1 --yes",
  "audit list --limit 5",
];

const TOKENS = [
  {
    token: "mock_admin",
    desc: "Lectura + escritura (crear, editar, borrar, acciones)",
  },
  { token: "mock_readonly", desc: "Solo lectura (listar, consultar ventas)" },
  {
    token: "mock_invalid",
    desc: "No existe — sirve para ver el manejo de errores",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex-1 bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ticketing para personas y agentes de IA
          </h1>
          <p className="mb-6 max-w-xl text-neutral-400">
            Un CLI mock de ticketera, usable desde el browser.
          </p>
          <Link
            href="/terminal"
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-green-400"
          >
            Abrir la terminal →
          </Link>
        </header>

        {/* Tokens */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold">Tokens mock</h2>
          <div className="space-y-2">
            {TOKENS.map((t) => (
              <div
                key={t.token}
                className="flex flex-col gap-1 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <code className="font-mono text-sm text-green-400">
                  {t.token}
                </code>
                <span className="text-sm text-neutral-400">{t.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quickstart */}
        <section className="mb-12">
          <h2 className="mb-2 text-lg font-semibold">Probalo en 30 segundos</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Abrí la terminal y pegá estos comandos en orden: crea un evento
            desde cero, le agrega fecha, tickets y un descuento, consulta ventas
            y pausa la venta. Cada comando devuelve el id que usa el siguiente.
          </p>
          <div className="space-y-2">
            {QUICKSTART.map((cmd) => (
              <CommandBlock key={cmd} command={cmd} />
            ))}
          </div>
        </section>

        {/* Solo lectura */}
        <section className="mb-12">
          <h2 className="mb-2 text-lg font-semibold">Modo solo lectura</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Con <code className="font-mono text-green-400">mock_readonly</code>{" "}
            solo se puede consultar. Cualquier intento de escritura se rechaza
            con un error accionable.
          </p>
          <div className="space-y-2">
            {READONLY.map((cmd) => (
              <CommandBlock key={cmd} command={cmd} />
            ))}
          </div>
        </section>

        {/* Guardrails */}
        <section className="mb-12">
          <h2 className="mb-2 text-lg font-semibold">Guardrails</h2>
          <p className="mb-4 text-sm text-neutral-400">
            <code className="font-mono text-green-400">--dry-run</code>{" "}
            previsualiza sin ejecutar, los borrados exigen{" "}
            <code className="font-mono text-green-400">--yes</code>, y todo
            comando ejecutado queda en el audit log.
          </p>
          <div className="space-y-2">
            {GUARDRAILS.map((cmd) => (
              <CommandBlock key={cmd} command={cmd} />
            ))}
          </div>
        </section>

        {/* Ayuda */}
        <section className="mb-12">
          <h2 className="mb-2 text-lg font-semibold">¿Perdido?</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Escribí <code className="font-mono text-green-400">help</code> en la
            terminal para ver todos los recursos, acciones y ejemplos.
          </p>
          <CommandBlock command="help" />
        </section>
      </div>
    </div>
  );
}
