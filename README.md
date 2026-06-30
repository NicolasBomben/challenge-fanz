# Fanz CLI — ticketing para personas y agentes

CLI mock de una ticketera, usable desde el browser por personas y por agentes de
IA. Permite operar una cuenta mock: eventos, fechas, tickets, descuentos, ventas
y una acción de negocio (pausar/reanudar ventas). Outputs JSON estables, comandos
predecibles y guardrails reales.

## Probarlo

1. Abrí la URL pública: **https://challenge-fanz-ivory.vercel.app/** (o `npm run dev` → `http://localhost:3000`).
2. Entrá a **/terminal** (link desde la landing).
3. Logueate y empezá a tirar comandos.

No hay que instalar nada: todo corre en el navegador contra un endpoint mock.

## Tokens mock

| Token | Permisos |
|---|---|
| `mock_admin` | Lectura + escritura (crear, editar, borrar, acciones) |
| `mock_readonly` | Solo lectura (listar, consultar ventas) |
| `mock_invalid` | No existe — sirve para ver el manejo de errores |

## Flujo end-to-end (copiá y pegá en la terminal)

```bash
# 1. Autenticarse
login --token mock_admin

# 2. Crear un evento desde cero (devuelve el id, ej: EVT_4)
events create --name "Mi Festival" --location "Buenos Aires" --status published

# 3. Agregarle una fecha/función (devuelve el id, ej: DATE_7)
dates create --event EVT_4 --datetime 2026-12-20T21:00:00Z --venue "Movistar Arena"

# 4. Agregar un tipo de ticket a esa fecha
tickets create --date DATE_7 --name General --price 18000 --stock 1000

# 5. Crear un descuento del 15%
discounts create --event EVT_4 --code LANZAMIENTO --percent 15

# 6. Consultar ventas / stats del evento
sales stats --event EVT_4

# 7. Pausar las ventas (acción de negocio, en cascada)
actions pause --event EVT_4
```

> Los IDs (`EVT_4`, `DATE_7`) son los que devuelve cada comando sobre el estado
> inicial. Si creás más entidades, usá los IDs que te devuelva la respuesta.

## Modo solo lectura

```bash
login --token mock_readonly
events list
sales stats --event EVT_1
# Cualquier escritura se rechaza con un error accionable.
```

## Guardrails

```bash
events delete EVT_1 --dry-run   # previsualiza la cascada sin ejecutar
events delete EVT_1 --yes       # confirma el borrado
audit list --limit 5            # log de comandos ejecutados
```

- **`--dry-run`** en toda acción de escritura: muestra qué pasaría sin aplicarlo.
- **`--yes`** obligatorio en borrados.
- **Separación lectura/escritura** por token.
- **Validaciones de negocio**: stock ≥ vendido, fecha futura, código único, rangos.
- **Errores accionables**: qué falló + cómo resolverlo.
- **Audit log** de comandos ejecutados (`audit list`).

## Recursos y comandos

Escribí `help` en la terminal para la lista completa. Resumen:

| Recurso | Acciones |
|---|---|
| `events` | list, get, create, update, delete |
| `dates` | list, get, create, update, delete |
| `tickets` | list, get, create, update, delete |
| `discounts` | list, get, create, update, delete |
| `sales` | list, get, stats |
| `buyers` | list, get |
| `actions` | pause, resume |
| `audit` | list |

Más `login` y `help` como comandos especiales.

## Uso por un agente / API

La terminal es azúcar sobre un único endpoint. Un agente puede llamarlo directo:

```bash
curl -X POST https://challenge-fanz-ivory.vercel.app/api/cli \
  -H "Content-Type: application/json" \
  -d '{"command": "events list", "token": "mock_admin"}'
```

Respuesta (siempre la misma forma, parseable):

```json
{ "ok": true, "command": "events list", "data": [ ... ], "message": "Found 3 event(s)." }
```

## Decisiones, supuestos y limitaciones

**Decisiones clave**

- Un solo proyecto Next.js con estado mock in-memory (`lib/store`): el challenge no
  necesita DB ni auth real.
- Toda la CLI pasa por un único endpoint `POST /api/cli`, con contrato de salida
  estable `{ ok, command, data?, message?, error?, dryRun? }`.
- Errores de negocio/auth → **HTTP 200 con `ok: false`** (contrato más predecible
  para un agente que mapear códigos 4xx).
- Modelo `Event → EventDate → TicketType`; `status` (publicación) separado de
  `saleStatus` (venta), para poder **pausar ventas sin cancelar el evento**.
- Comandos como registry `resource → action → handler`: agregar un comando es
  agregar una entrada; alimenta `help` y los errores accionables.

**Supuestos**

- Una sola cuenta mock (`ACC_1`); el token mapea a un rol y a esa cuenta.
- Borrar un tipo de ticket no borra órdenes históricas.
- "Fecha futura" se valida contra el reloj real del server.
- El prefijo `fanz` es opcional y el id es el último posicional.

**Limitaciones / qué haría con más tiempo**

- El estado es in-memory: se reinicia al reiniciar el server y **no se comparte entre
  cold starts / instancias serverless de Vercel** (los cambios pueden no persistir
  entre requests).
- Sin tests automatizados (la arquitectura ya está pensada para testear: funciones
  puras y aisladas).
- Sin persistencia, compra mock viva, rate limiting ni paginación en listados grandes.

> Detalle completo en [docs/DECISIONS.md](docs/DECISIONS.md).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
```

Stack: Next.js (App Router) + TypeScript, estado mock in-memory, xterm.js para la
terminal.
