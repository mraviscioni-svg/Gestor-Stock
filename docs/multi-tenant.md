# Multi-tenant (SaaS)

## Modelo de datos

- **`Tenant`**: comercio con `slug` único global, `status`, `currentPlan`, `subscriptionStatus`, límites opcionales `maxUsers` / `maxProducts`, contacto (`email`, `phone`), `logoUrl`, `subdomain` opcional para futuro host-based routing.
- **`User`**: pertenece a un `tenant` con `@@unique([tenantId, email])`. **`SUPER_ADMIN`** de plataforma tiene `tenantId = null` y no opera datos de un comercio vía rutas `/t/...`.
- **`Category`**, **`Product`**, **`Sale`**, **`SaleItem`**, **`StockMovement`**, **`UserActivity`**: siempre con `tenantId` donde aplica.
- **`AuditLog`**: eventos (`LOGIN`, `TENANT_CREATED`, `USER_CREATED`, `SALE_CREATED`, etc.) con `actorUserId`, `actorTenantId` opcional y `metadata` JSON.

## Reglas de seguridad

1. **Toda lectura/escritura operativa** filtra por `tenantId` derivado de la sesión en servidor (`requireTenantSession` → `session.tenantId`).
2. **Nunca** usar `tenantId` enviado por el cliente como fuente de verdad. Si llega en body/query, solo para *cross-check* (`assertTenantScope`) contra la sesión.
3. **JWT** (cookie `kiosco_session`): `sub` = `userId`, `tid` + `tslug` para usuarios de comercio; `SUPER_ADMIN` solo lleva `role` (sin `tid`).
4. **Rutas UI**: panel del comercio bajo **`/t/[slug]/...`**. El middleware valida que `slug` coincida con `session.tenantSlug`. Rutas legacy (`/dashboard`, `/products`, …) redirigen a `/t/{slug}/...`.
5. **Panel plataforma**: **`/admin`** y APIs **`/api/admin/*`** solo con `SUPER_ADMIN` (validación en cada route handler).

## Resolución de tenant

1. **Login** (`POST /api/auth/login`): busca usuario; si es tenant-user activo y comercio `ACTIVE`, emite JWT con `tenantId` + `tenantSlug` + `role`. Responde `redirectTo: /t/{slug}/dashboard`.
2. **`requireTenantSession()`** en APIs del comercio: exige `tenantId` y `tenantSlug` en token y rechaza `SUPER_ADMIN`.
3. **`getTenantIdForRequest(session: TenantSessionUser)`**: devuelve `session.tenantId` tras `requireTenantSession`.
4. **Futuro subdominio**: resolver host `slug.dominio.com` → mismo contexto que hoy el path `/t/slug` (middleware rewrite o cookie alineada al host).

## SaaS onboarding (admin)

1. `SUPER_ADMIN` crea tenant en **`/admin/tenants/new`** (o `POST /api/admin/tenants`).
2. Alta de usuarios del comercio desde **`/admin/tenants/[id]`** o por el OWNER en **Comercio → Equipo** (`/t/[slug]/settings/users`).
3. Límites `maxUsers` / `maxProducts` aplican al crear usuario o producto (errores de negocio `PLAN_LIMIT_*`).

## Seed y variables

- Por defecto: `SEED_SUPER_ADMIN_EMAIL` = `admin@gestor.platform`, `SEED_SUPER_ADMIN_PASSWORD` = `ChangeMePlatform2026!` (sobreescribibles por env).
- Tenant demo: slug `demo-kiosco`, owner y cajero (ver `src/config/demo-auth-defaults.ts`).
- Vercel: `scripts/vercel-auto-seed.ts` ejecuta seed si no hay super admin ni owner demo.

## Documentación relacionada

- `docs/architecture.md` — capas servicio/repositorio/API.
- `docs/ventas-pos.md` — flujo de ventas.
