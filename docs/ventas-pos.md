# Ventas: POS, diferidas y monitor (MVP)

## Venta inmediata

- Pantalla **Punto de venta** (`/sales/pos`): carrito, total visible, medio de pago y **Finalizar venta**.
- El backend crea `Sale` con `paymentStatus = PAID`, `saleStatus = CLOSED`, descuenta stock y asocia `userId` desde la **sesión** (no se acepta `userId` del cliente).

## Venta diferida (boliche / evento)

- En POS: **Guardar pendiente** sin elegir medio de pago.
- Estado: `paymentStatus = PENDING`, `saleStatus = OPEN`. El stock se descuenta al guardar (consumo registrado).
- **Ventas abiertas** (`/sales/open`): listado con cobro (elige medio de pago) o anulación (devuelve stock).
- **Cierre**: `PATCH /api/sales/:id/close` con `paymentMethod` → `PAID` + `CLOSED` + `closedAt`.
- **Cancelación**: `PATCH /api/sales/:id/cancel` → `CANCELLED` y movimientos de stock de devolución.

## Historial

- `GET /api/sales` respeta rol: cajero ve solo sus ventas; admin/dueño/visor ve el tenant.
- UI: `/sales/history`.

## Monitor en vivo

- Ruta `/manager/live-sales` (roles: dueño, admin, visor — solo lectura en UI para visor en cobros/cancelaciones vía API).
- `GET /api/manager/live-sales`: usuarios del tenant, última actividad (`UserActivity`), agregados del día, ventas abiertas.
- **Online**: `lastSeenAt` dentro de los últimos **2 minutos** (MVP).
- Actualización: **polling ~12 s** en el cliente. Evolución natural: WebSockets / SSE.

## Actividad

- `POST /api/activity/ping` con `{ "page": "/ruta" }` — el layout del panel envía heartbeat al cambiar de ruta y cada **45 s**.

## Roles (resumen)

| Rol        | POS | Ver todas las ventas | Abiertas / cobrar ajena | Monitor |
|------------|-----|----------------------|-------------------------|---------|
| CASHIER    | Sí  | No (solo propias)    | Propias                 | No      |
| ADMIN/OWNER | Sí | Sí                   | Sí                      | Sí      |
| VIEWER     | No  | Sí (lectura)         | Lista sí; cobrar no   | Sí      |

`SUPER_ADMIN` se trata como admin a efectos de permisos en el tenant actual (sesión con `tenantId`).

## Migración de datos

El modelo `Sale` incorpora campos nuevos; bases existentes requieren `prisma db push` (o migración SQL equivalente). El build de Vercel usa `db push --accept-data-loss` según `package.json`.
