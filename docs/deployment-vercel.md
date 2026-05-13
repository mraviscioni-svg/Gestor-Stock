# Deploy en Vercel (Hobby)

## Prerrequisitos

- Cuenta Vercel + repo GitHub con este proyecto.
- Base **PostgreSQL** (Neon o Supabase) con string de conexión compatible con Prisma.

## Variables de entorno (Proyecto → Settings → Environment Variables)

| Variable | Entorno sugerido | Descripción |
|----------|------------------|-------------|
| `DATABASE_URL` | Production / Preview / Development | URL Postgres. En Neon, preferí **pooled** para serverless + `?sslmode=require`. |
| `JWT_SECRET` | Todos | Secreto largo (≥16). Distinto por ambiente en ideal. |
| `NEXT_PUBLIC_APP_ENV` | Production = `production`, Preview = `preprod` | Etiqueta visible en panel / logs de alto nivel. |
| `NEXT_PUBLIC_APP_URL` | Production = URL canónica (`https://...`) | Útil para links absolutos futuros. |
| `NEXT_PUBLIC_DEMO_LOGIN_HINT` | Opcional | Texto extra en login (sin secretos). |
| `BOOTSTRAP_SECRET` | Opcional (solo para primer seed vía API) | Ver README; borrar tras usar. |

Las credenciales del usuario demo están en **`src/config/demo-auth-defaults.ts`** y en la DB (hash); **no** van en variables de entorno.

## Build

El script `build` ejecuta `prisma generate`, `prisma db push` y `next build` (tablas alineadas con el schema en cada deploy).

## Migraciones / datos

En el primer deploy, `db push` en el build crea tablas. Para datos demo:

1. Llamá una vez a `POST /api/internal/bootstrap` con `BOOTSTRAP_SECRET` (ver README), **o**
2. Desde tu máquina: `npm run db:seed` (usa las mismas credenciales por defecto del archivo `demo-auth-defaults.ts`).

## Límites típicos (Hobby) a tener en cuenta

- Funciones serverless con **timeouts** y **concurrencia** acotados vs un VPS.  
- Conexiones DB: usar **pooler** (Neon pooler / Supavisor) y evitar conexiones largas.  
- **WebSockets** persistentes no son el foco de este MVP (no se usan).

## GitHub → Vercel

1. Import Project → seleccioná el repo **Gestor-Stock** en GitHub.  
2. Framework Preset: Next.js.  
3. Root directory: `/` (si el repo es solo este proyecto).  
4. Asigná variables por ambiente (Production vs Preview).  
5. Conectá **Preview** a rama `preprod` o `develop` según tu flujo (Branch settings en Vercel).

## Futura migración

Ver `docs/architecture.md`: los route handlers son delgados; la lógica está en `services/` + `repositories/` para portar a un servicio dedicado sin tocar la UI.
