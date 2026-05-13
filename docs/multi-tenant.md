# Multi-tenant (MVP)

## Modelo de datos

- `Tenant`: organización (kiosco / cuenta).  
- `User`: pertenece a un `tenant` salvo futuros `SUPER_ADMIN` globales.  
- `Category`, `Product`, `Sale`, `SaleItem`, `StockMovement`: siempre con `tenantId`.

## Reglas

1. **Toda lectura/escritura operativa** filtra por `tenantId` resuelto en servidor.  
2. **Unicidad relativa al tenant**: barcode de producto, nombre de categoría.  
3. **Nunca** tomar `tenantId` del cliente como fuente de verdad en operaciones sensibles. Si llega en el body/query, solo puede usarse para *cross-check* (`assertTenantScope`) contra la sesión.  
4. **Roles** (`SUPER_ADMIN`, `OWNER`, `ADMIN`, `CASHIER`, `VIEWER`) quedan modelados; el MVP usa JWT con `role` pero aún no aplica ABAC fino en cada ruta.

## Resolución de tenant (MVP)

- `getTenantIdForRequest(session)` en `src/lib/tenant.ts` devuelve el tenant del usuario autenticado.  
- Futuro: subdominio (`tenantSlug.tudominio.com`), header interno de gateway, o impersonación admin con auditoría.

## Demo

El `seed` crea un tenant slug `demo-kiosco`, usuario owner y datos de ejemplo. Las APIs usan el tenant inferido de la sesión tras login.
