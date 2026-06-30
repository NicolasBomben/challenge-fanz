# Decisiones, supuestos y limitaciones

## Decisiones de arquitectura

### Un solo proyecto Next.js

El challenge no necesita auth real, base de datos ni escalar: el "backend" es
estado mock en memoria. Separar en dos servicios habría sumado fricción sin ningún beneficio.

### Estado mock in-memory (sin base de datos)

El estado vive en un singleton en memoria (`lib/store`), inicializado desde un
seed tipado.

### Un único endpoint `POST /api/cli`

Toda la CLI pasa por un solo endpoint que recibe `{ command, token }` y devuelve un
`CLIResponse`.

### Contrato de salida estable + HTTP 200 para errores de negocio

Todas las respuestas tienen la misma forma: `{ ok, command, data?, message?, error?, dryRun? }`.
Los errores de negocio o de auth devuelven **HTTP 200 con `ok: false`**, no códigos
4xx. Razón: para un agente de IA, el campo `ok` del body es un contrato más
predecible que mapear códigos HTTP.

---

## Decisiones de diseño del dominio

### Separación Event → EventDate → TicketType

Un `Event` no tiene fecha propia: las fechas son `EventDate` (funciones), y los
tickets cuelgan de una fecha. Esto modela bien una ticketera real (un evento con
varias funciones, cada una con su stock) y permite operaciones anidadas y borrados
en cascada coherentes.

### `status` (publicación) separado de `saleStatus` (venta)

El evento tiene dos estados independientes: si está publicado/cancelado y si la
venta está activa/pausada. Permite **pausar ventas sin cancelar el evento**, que es
la acción extra elegida.

### Validaciones de negocio en el repository, no solo en el handler

Reglas como "no bajar el stock por debajo de lo vendido" viven en
`lib/store/repositories`, no en el handler. Así la regla está protegida aunque se
invoque desde otro lugar, y no depende de que cada handler se acuerde de validar.

### Comandos como registry de datos (`resource → action → handler`)

Agregar un comando es agregar una entrada, no tocar lógica de dispatch. El registry
también alimenta los errores accionables ("acción desconocida, disponibles: ...") y
el comando `help`, que se construye desde el registry y nunca queda desactualizado.

---

## Guardrails

- **`--dry-run`** en toda acción de escritura: previsualiza sin aplicar.
- **`--yes`** obligatorio en borrados, con reporte de la cascada.
- **Separación lectura/escritura** por token, _fail-safe_: si un recurso/acción no
  está clasificado como lectura, se asume escritura (requiere admin).
- **Errores accionables**: cada error dice qué falló y cómo resolverlo, no un
  mensaje genérico.
- **Audit log** de todos los comandos ejecutados, consultable con `audit list`.
- **Acción `pause` idempotente** y en cascada: solo invierte `active ↔ paused`, no
  pisa lo `sold_out`/`closed`. Segura de re-ejecutar importante para agentes.

---

## Supuestos

- Una sola cuenta mock (`ACC_1`); el token mapea a un rol y a esa cuenta.
- Las órdenes son históricas: borrar un tipo de ticket no borra órdenes pasadas.
- "Fecha futura" se valida contra el reloj real del server al crear/editar fechas.
- El prefijo `fanz` en los comandos es opcional (`fanz events list` = `events list`).
- El id de una entidad es el último posicional, lo que permite tanto
  `tickets update TCK_1` como la forma del PDF `tickets update EVT_1 TCK_1`.
- Auditar lecturas además de escrituras es deseable (trazabilidad de quién consultó
  qué); por eso `audit list` también queda registrado.

---

## Qué se haría distinto con más tiempo

- **Tests automatizados**: la arquitectura ya está pensada para eso — `format.ts`,
  `useCommandHistory`, el parser, los repositories y los handlers son funciones
  puras o aisladas, fáciles de testear.
- **Persistencia opcional** (ej: KV/SQLite) detrás de la misma interfaz de
  repositories, sin tocar handlers.
- **Compra mock viva**: un comando para emitir órdenes que ajuste stock/sold y
  recalcule stats en tiempo real.
- **Rate limiting / paginación** en listados grandes para un uso intensivo por agentes.
