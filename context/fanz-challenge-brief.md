# FANZ Challenge — Brief del Proyecto

## Contexto

Challenge técnico de Fanz: construir un CLI de ticketing usable por personas y agentes de IA para operar una cuenta mock. El entregable debe ser probable desde una URL pública, sin instalar nada.

**Deadline:** martes 30 de junio de 2026.

---

## Análisis técnico

### Qué se pide

Un CLI con:

- **Auth** con tokens mock (admin / read-only, etc.)
- **CRUD** de eventos, fechas/funciones, tipos de ticket y descuentos
- **Consultas de ventas**: compradores, tickets emitidos, revenue, stock restante, estado de orden
- **Al menos una acción extra** con sentido para ticketera: pausar ventas, duplicar evento, re-enviar tickets, exportar ventas
- **Guardrails**: dry-run, validaciones, audit log, separación lectura/escritura, mensajes de error accionables
- **Deploy público** accesible desde el browser (web terminal)
- **Instructivo** con credenciales mock y ejemplos end-to-end

### Lo que Fanz va a evaluar con más atención

1. **Calidad de la interfaz para agentes**: outputs JSON estables, comandos predecibles, bajo riesgo de acciones accidentales
2. **Buenas abstracciones** del dominio ticketera
3. **Guardrails reales** (no decorativos)
4. **Autonomía**: decisiones bien fundamentadas, supuestos claros

### Decisión de arquitectura

**Un solo proyecto Next.js en Vercel.** No separar NestJS + Next.js.

Razones:

- No hay auth real, DB, ni necesidad de escalar — el "backend" es estado mock en memoria
- Dos deploys = más fricción para Fanz al probar
- El tiempo de setup separado es mejor invertido en guardrails y diseño de comandos
- Los patrones de NestJS (controllers, services, separación de capas) se reproducen igual con route handlers + carpetas `/lib`

### Stack final

- **Next.js (App Router)** + TypeScript
- **Route handlers** como capa de API (`/api/cli`, `/api/auth`)
- **Estado mock in-memory** con seed inicial (JSON tipado)
- **xterm.js** para la web terminal en el browser
- **Vercel** para deploy

### Estructura propuesta

```
/app
  /api
    /cli           → POST: recibe comando, devuelve output JSON
    /auth          → validación de token mock
  /terminal       → página con xterm.js (UI pública)
  /page.tsx       → landing con instructivo + link a /terminal

/lib
  /store          → estado mock + seed (eventos, tickets, ventas, etc.)
  /commands       → lógica de cada comando (un archivo por dominio)
    events.ts
    dates.ts
    tickets.ts
    discounts.ts
    sales.ts
    actions.ts
  /parser         → parsea string del CLI a { command, args, flags }
  /auth           → validación de tokens y permisos
  /audit          → audit log en memoria
  /types          → tipos compartidos del dominio

/docs
  README.md       → instructivo público
  DECISIONS.md    → nota corta de decisiones, supuestos, limitaciones
```

### Modelo de datos (alto nivel)

- **Account** → contiene todo lo demás
- **Event** → name, description, location, status, dates[]
- **EventDate** (función) → datetime, venue, status, tickets[]
- **TicketType** → name, price, stock, sold, status
- **Discount** → code, type (percent/fixed), value, scope (event/global), usageLimit
- **Order** → buyer, items[], total, status, createdAt
- **Buyer** → email, name, ordersCount
- **AuditLogEntry** → token, command, args, timestamp, result

### Tokens mock

- `mock_admin` → lectura + escritura
- `mock_readonly` → solo lectura
- `mock_invalid` → para demostrar manejo de errores

---

## Plan de trabajo (un paso a la vez)

> **Importante:** trabajar **un punto a la vez**, terminar cada uno antes de pasar al siguiente. Cada paso es una oportunidad para entender qué se está haciendo y por qué.

### Paso 1 — Setup del proyecto

- Crear el proyecto Next.js con App Router + TypeScript
- Configurar la estructura de carpetas `/lib`, `/app/api`
- Verificar que el dev server corre
- **Objetivo:** entender por qué cada carpeta existe antes de escribir lógica

### Paso 2 — Tipos del dominio

- Definir interfaces en `/lib/types`: `Event`, `EventDate`, `TicketType`, `Discount`, `Order`, `Buyer`, `AuditLogEntry`
- Sin lógica todavía, solo modelado
- **Objetivo:** pensar el dominio antes de programarlo

### Paso 3 — Store mock + seed

- Crear el store in-memory en `/lib/store`
- Escribir un seed con datos realistas (2-3 eventos, fechas, tickets, ventas, compradores)
- Funciones básicas: `getAll`, `getById`, `create`, `update`, `delete` por entidad
- **Objetivo:** tener data con la que jugar antes de tocar comandos

### Paso 4 — Parser de comandos

- Función que toma un string `fanz events create --name "X" --date Y` y devuelve `{ resource, action, args, flags }`
- Manejo de flags (`--name`, `--json`, `--dry-run`)
- Tests manuales con varios formatos
- **Objetivo:** entender cómo se traduce un CLI a estructuras de datos

### Paso 5 — Auth y permisos

- Validar tokens mock
- Función `canExecute(token, command)` que decide si un token puede correr un comando
- Separación lectura/escritura
- **Objetivo:** entender el patrón de guards/middleware sin un framework

### Paso 6 — Primer comando end-to-end: `fanz events list`

- Conectar: parser → auth → comando → store → output JSON
- Crear el route handler `/api/cli` que orquesta todo
- Probar con `curl` o Thunder Client
- **Objetivo:** validar la arquitectura completa con un solo comando antes de escribir el resto

### Paso 7 — CRUD de eventos

- `events create`, `events list`, `events get`, `events update`, `events delete`
- Validaciones: nombre requerido, fecha futura, etc.
- Errores accionables (no genéricos)
- **Objetivo:** patrón replicable para los demás recursos

### Paso 8 — CRUD de fechas/funciones

- Mismas operaciones, anidadas bajo un evento
- **Objetivo:** trabajar relaciones entre entidades

### Paso 9 — CRUD de tipos de ticket

- Incluir stock, precio, cupo vendido
- Validar que no se baje stock por debajo de lo vendido
- **Objetivo:** validaciones de negocio reales

### Paso 10 — CRUD de descuentos

- Códigos, porcentaje o monto fijo, scope por evento o global
- Validar formato del código, valores positivos
- **Objetivo:** otra entidad con reglas propias

### Paso 11 — Consultas de ventas

- `sales list`, `sales get`, `sales stats` (revenue, stock restante, top compradores)
- Filtros por evento, fecha, estado
- **Objetivo:** trabajar lecturas complejas y agregaciones

### Paso 12 — Acción extra

- Elegir una con buen valor demostrativo: **pausar ventas** o **duplicar evento** son las más claras
- **Objetivo:** mostrar pensamiento de producto, no solo CRUD

### Paso 13 — Guardrails

- `--dry-run` en todas las acciones destructivas: muestra qué pasaría sin ejecutar
- Confirmación obligatoria en `delete` sin flag `--yes`
- Audit log de todos los comandos ejecutados
- Comando `fanz audit list` para verlo
- **Objetivo:** este es el diferenciador del challenge — invertir tiempo acá

### Paso 14 — Web terminal con xterm.js

- Página `/terminal` que renderiza xterm.js
- Conectar el input al endpoint `/api/cli`
- Mostrar output formateado (JSON o texto humano)
- Histórico de comandos con flechas arriba/abajo
- **Objetivo:** la UI que va a ver Fanz

### Paso 15 — Landing + instructivo

- Página `/` con: descripción corta, tokens mock, link a la terminal, ejemplos copiables
- README en el repo con el mismo contenido
- **Objetivo:** que Fanz entienda el proyecto en 30 segundos

### Paso 16 — Deploy en Vercel

- Conectar repo, deploy, verificar URL pública
- Probar todo el flujo desde la URL real
- **Objetivo:** entregable funcionando

### Paso 17 — Nota de decisiones

- `DECISIONS.md` corto: por qué Next.js solo, por qué store in-memory, qué quedó fuera del scope, qué se haría diferente con más tiempo
- **Objetivo:** mostrar criterio técnico

### Paso 18 — Polish final

- Probar el instructivo paso a paso como si fuera Fanz
- Verificar errores accionables en casos raros
- Ajustar mensajes de output

---

## Reglas de trabajo

1. **Un paso por sesión** (o por bloque) — no saltar adelante
2. **Entender antes de copiar** — si algo no se entiende, parar y preguntar
3. **Commits chicos y descriptivos** por cada paso completado
4. **Probar manualmente** cada comando antes de pasar al siguiente
5. **No optimizar prematuramente** — primero que funcione, después se pule

---

## Lo que queda fuera del scope (explícito en DECISIONS.md)

- Persistencia real (DB) — se reinicia el estado en cada deploy
- Auth real con OAuth/JWT — solo tokens mock hardcodeados
- Pagos reales
- Multi-tenant real
- Tests automatizados (mencionar que se agregarían con más tiempo)
