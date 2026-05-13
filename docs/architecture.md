# Arquitectura (MVP)

## Visión general

La app es un monolito **Next.js (App Router)** desplegable en **Vercel**: UI en React, **Route Handlers** como API HTTP, y **PostgreSQL** externo vía **Prisma**. El diseño prioriza separar capas para poder extraer el backend más adelante sin reescribir reglas de negocio.

## Capas

1. **UI (`src/app`, `src/components`)**  
   Componentes de presentación. Los datos mutables llegan por `fetch` a `/api/*` (credenciales incluidas para cookies httpOnly). El dashboard principal también puede leer datos en Server Components cuando conviene (menos round-trips).

2. **Servicios (`src/services`)**  
   Casos de uso: validaciones de dominio, transacciones (ventas + stock), reglas multi-tenant en conjunto con la sesión.

3. **Repositorios (`src/repositories`)**  
   Acceso a datos con Prisma. Todas las consultas reciben `tenantId` desde la capa superior (nunca desde el cliente de forma aislada).

4. **Infra / cross-cutting (`src/lib`)**  
   Prisma singleton serverless-friendly, auth JWT en cookie, utilidades HTTP, validaciones Zod compartidas con API.

## Autenticación (MVP)

- **JWT firmado (jose)** en cookie `httpOnly` (`kiosco_session`). El código de tokens (`src/lib/auth/token.ts`) está separado de la lectura con `cookies()` (`src/lib/auth/server.ts`) para que el **middleware Edge** no arrastre `next/headers` de forma indirecta.
- **Middleware** protege rutas de panel usando solo verificación de JWT.
- Las **APIs** vuelven a validar sesión en servidor (`requireSession`) y derivan `tenantId` del token, no del body.

## Multi-tenant

Modelo relacional con `tenantId` en entidades operativas. Restricciones únicas compuestas (`tenantId + barcode`, `tenantId + category name`). Detalle en `docs/multi-tenant.md`.

## Evolución / migración de backend

Los **Route Handlers** actúan como “BFF”. Para mover el backend a Render/Railway/Fly:

- Reimplementar los mismos endpoints (contratos JSON) en un servicio Node/Fastify/Nest.  
- Reemplazar llamadas `fetch("/api/...")` por `fetch(process.env.NEXT_PUBLIC_API_URL + ...)` o proxy rewrites en `next.config`.  
- **Servicios y repositorios** pueden moverse casi tal cual a un paquete compartido (`packages/core`) consumido por el worker API.  
- Prisma puede seguir igual; solo cambia el runtime (long-lived vs serverless).
