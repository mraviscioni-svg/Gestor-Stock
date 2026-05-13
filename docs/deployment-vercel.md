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
| `NEXT_PUBLIC_DEMO_LOGIN_HINT` | Preview opcional | Texto de ayuda en login (sin secretos). |

> **No** configures `SEED_DEMO_PASSWORD` en Vercel salvo que ejecutes seed desde CI contra esa DB (no recomendado en producción).

## Build

El script `build` ejecuta `prisma generate` antes de `next build` para asegurar el client en CI/Vercel.

## Migraciones

En el primer deploy:

1. Desde tu máquina (o CI) con `DATABASE_URL` apuntando al entorno remoto:  
   `npx prisma migrate deploy`  
   o, en MVP inicial, `npx prisma db push` si aún no versionás migraciones.
2. Seed solo en entornos de demo: `npm run db:seed` con variables de seed locales.

## Límites típicos (Hobby) a tener en cuenta

- Funciones serverless con **timeouts** y **concurrencia** acotados vs un VPS.  
- Conexiones DB: usar **pooler** (Neon pooler / Supavisor) y evitar conexiones largas.  
- **WebSockets** persistentes no son el foco de este MVP (no se usan).

## GitHub → Vercel

1. Import Project → seleccioná el repo (p. ej. `gestor-de-stock` en GitHub).  
2. Framework Preset: Next.js.  
3. Root directory: `/` (si el repo es solo este proyecto).  
4. Asigná variables por ambiente (Production vs Preview).  
5. Conectá **Preview** a rama `preprod` o `develop` según tu flujo (Branch settings en Vercel).

## Futura migración

Ver `docs/architecture.md`: los route handlers son delgados; la lógica está en `services/` + `repositories/` para portar a un servicio dedicado sin tocar la UI.
