# Multi-tenant (SaaS)

## Modelo de datos

- **`Tenant`**: comercio con `slug` único global (identificador interno; **no hace falta ponerlo en la URL**), `status`, `currentPlan`, `subscriptionStatus`, límites opcionales `maxUsers` / `maxProducts`, contacto (`email`, `phone`), `logoUrl`, `subdomain` opcional para futuro host-based routing.
- **`User`**: pertenece a un `tenant` con `@@unique([tenantId, email])`. **`SUPER_ADMIN`** de plataforma tiene `tenantId = null` y no usa el panel de comercio (`/dashboard`, …).
- **`Category`**, **`Product`**, **`Sale`**, **`SaleItem`**, **`StockMovement`**, **`UserActivity`**: siempre con `tenantId` donde aplica.
- **`AuditLog`**: eventos (`LOGIN`, `TENANT_CREATED`, `USER_CREATED`, `SALE_CREATED`, etc.) con `actorUserId`, `actorTenantId` opcional y `metadata` JSON.

## Reglas de seguridad

1. **Toda lectura/escritura operativa** filtra por `tenantId` derivado de la sesión en servidor (`requireTenantSession` → `session.tenantId`).
2. **Nunca** usar `tenantId` enviado por el cliente como fuente de verdad. Si llega en body/query, solo para *cross-check* (`assertTenantScope`) contra la sesión.
3. **JWT** (cookie `kiosco_session`): `sub` = `userId`, `tid` + `tslug` para usuarios de comercio (el slug en el token alinea datos; la UI no lo muestra en la ruta); `SUPER_ADMIN` solo lleva `role` (sin `tid`).
4. **Rutas UI del comercio**: **`/dashboard`**, **`/products`**, **`/sales`**, etc. El tenant lo define **solo la sesión** tras el login. Las URLs antiguas **`/t/[slug]/...`** redirigen al mismo path sin prefijo (compatibilidad).
5. **Panel plataforma**: **`/admin`** y APIs **`/api/admin/*`** solo con `SUPER_ADMIN` (validación en cada route handler). El login con `?next=/admin` envía `platformOnly` y devuelve **404** claro si no existe SUPER_ADMIN en la base.

## Resolución de tenant

1. **Login** (`POST /api/auth/login`): resuelve usuario; si es comercio activo, emite JWT con `tenantId` + `tenantSlug` + `role`. Responde `redirectTo: /dashboard`. Si el mismo email está en varios comercios, el servidor puede pedir `tenantSlug` en el body (solo para desambiguar, no para rutas).
2. **`requireTenantSession()`** en APIs del comercio: exige `tenantId` y `tenantSlug` en token y rechaza `SUPER_ADMIN`.
3. **`getTenantIdForRequest(session: TenantSessionUser)`**: devuelve `session.tenantId` tras `requireTenantSession`.
4. **Futuro subdominio**: resolver host `slug.dominio.com` → reescritura interna a las mismas rutas (`/dashboard`, …) manteniendo el token.

## SaaS onboarding (admin)

1. `SUPER_ADMIN` crea tenant en **`/admin/tenants/new`** (o `POST /api/admin/tenants`).
2. Alta de usuarios del comercio desde **`/admin/tenants/[id]`** o por el OWNER en **Comercio → Equipo** (`/settings/users`).
3. Límites `maxUsers` / `maxProducts` aplican al crear usuario o producto (errores de negocio `PLAN_LIMIT_*`).

## Seed y variables

- Por defecto: `SEED_SUPER_ADMIN_EMAIL` = `admin@gestor.platform`, `SEED_SUPER_ADMIN_PASSWORD` = `ChangeMePlatform2026!` (sobreescribibles por env).
- Tenant demo: slug `demo-kiosco`, owner y cajero (ver `src/config/demo-auth-defaults.ts`).
- Vercel: `scripts/vercel-auto-seed.ts` ejecuta seed si no hay super admin ni owner demo.

## Documentación relacionada

- `docs/architecture.md` — capas servicio/repositorio/API.
- `docs/ventas-pos.md` — flujo de ventas.
