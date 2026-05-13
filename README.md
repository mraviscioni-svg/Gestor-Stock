# Gestor de Stock (MVP)

SaaS **multi-tenant** para **catálogo, ventas y stock**: lector de código de barras tipo teclado (HID), ajustes de inventario y panel operativo. Pensado para **Vercel Hobby** + **PostgreSQL** externo (**Neon** o **Supabase**) y **Prisma ORM**.

## Stack

- Next.js (App Router) + TypeScript  
- Tailwind CSS  
- Route Handlers (`src/app/api/**`)  
- Prisma + PostgreSQL  
- Auth MVP: **JWT en cookie httpOnly** (`jose` + `bcryptjs`)  
- UI moderna con sidebar, cards y tablas

## Estructura de ramas (Git)

- `develop`: desarrollo diario  
- `preprod`: demo / testing de cliente (Preview en Vercel)  
- `main`: producción (Production en Vercel)

> Sugerí commits temáticos en la historia del repo; si clonás este entorno sin `npm`, generá la historia local con los mensajes indicados en la sección “Git” del PR/entrega.

## Requisitos locales

- Node.js 20+ (recomendado 22)  
- npm  
- Cuenta en Neon o Supabase con una base Postgres vacía

## Configuración rápida

1. **Instalar dependencias**

```bash
cd gestor-de-stock
npm install
```

2. **Variables de entorno**

```bash
cp .env.example .env
```

Completá al menos:

- `DATABASE_URL` (Postgres)  
- `JWT_SECRET` (≥16 caracteres aleatorios)  
- `SEED_DEMO_PASSWORD` (≥8 caracteres) para poder correr el seed  
- `SEED_DEMO_OWNER_EMAIL` (opcional; por defecto `owner@demo.kiosco.local`)

3. **Prisma: migraciones**

```bash
npx prisma migrate dev --name init
```

> Alternativa rápida sin historial de migraciones todavía: `npx prisma db push`

4. **Seed demo (tenant + usuario + categorías + productos)**

```bash
npm run db:seed
```

5. **Desarrollo**

```bash
npm run dev
```

Abrí `http://localhost:3000`, iniciá sesión en `/login` con el email de seed y la contraseña definida en `SEED_DEMO_PASSWORD`.

### Variables públicas opcionales

- `NEXT_PUBLIC_DEMO_LOGIN_HINT`: texto de ayuda en pantalla de login (sin secretos).  
- `NEXT_PUBLIC_APP_ENV` / `NEXT_PUBLIC_APP_URL`: metadatos de ambiente y URL canónica.

## Neon / Supabase (DATABASE_URL)

- **Neon**: creá un proyecto → copiá la connection string **pooled** (recomendada para serverless) → pegala en `DATABASE_URL`. Asegurate de `sslmode=require` si aplica.  
- **Supabase**: Project Settings → Database → URI (modo **Transaction** o **Session** según guía de Prisma). Pegá en `DATABASE_URL`.

## Scanner de código de barras (HID)

No usa cámara ni permisos del navegador: el lector **simula teclado**. En **Ventas**, el campo de escaneo está siempre enfocable; al recibir **Enter**, se busca el producto por barcode vía API y se agrega al carrito. Ver `src/components/BarcodeInput.tsx`.

## Nombre del repositorio en GitHub

En GitHub el **nombre del repo** (la parte de la URL) **no puede llevar espacios**. Para “Gestor de Stock” lo habitual es usar el slug **`gestor-de-stock`** (URL: `https://github.com/mraviscioni-svg/gestor-de-stock`).

1. En GitHub: **Settings** del repo → **General** → **Repository name** → escribí `gestor-de-stock` → **Rename**.  
2. En tu máquina, actualizá el remoto:

```bash
git remote set-url origin https://github.com/mraviscioni-svg/gestor-de-stock.git
```

3. Opcional: en **Settings → General** podés completar el campo **Description** con el texto legible *Gestor de Stock* (eso sí admite espacios).

## Deploy en Vercel + GitHub

1. Subí el código a GitHub (repo en la raíz del proyecto).  
2. En Vercel: **New Project** → importá el repo → Framework: Next.js.  
3. Configurá **Environment Variables** (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_*`).  
4. Tras el primer deploy, ejecutá migraciones contra la DB remota desde tu máquina o CI:

```bash
npx prisma migrate deploy
```

5. (Solo entornos demo) ejecutá seed apuntando a esa base, con cuidado.

Documentación ampliada: `docs/deployment-vercel.md`.

## Endpoints API (MVP)

- `GET /api/health` — health simple  
- `GET/POST /api/products` — listado/creación (tenant desde sesión)  
- `PUT /api/products/:id` — actualización / desactivación (`active: false`)  
- `GET /api/products/barcode/:barcode` — lookup para venta  
- `GET/POST /api/sales` — historial / registrar venta (descuenta stock + movimiento)  
- `GET /api/stock/movements` — historial de movimientos  
- `POST /api/stock/adjust` — ajuste manual  
- `POST /api/auth/login` / `POST /api/auth/logout`  
- `GET /api/categories` — categorías del tenant

## Arquitectura y multi-tenant

- `docs/architecture.md` — capas, auth, plan de extracción de backend  
- `docs/multi-tenant.md` — reglas de `tenantId` y evolución

## Migración futura del backend

La lógica vive en `src/services` y `src/repositories`. Los route handlers son delgados. Para mover a Render/Railway/DigitalOcean: exponé los mismos contratos HTTP desde un servicio Node, reemplazá los `fetch("/api/...")` por tu API pública y compartí el paquete de dominio/datos.

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next en desarrollo |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Servidor producción |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` |
| `npm run db:seed` | Seed demo |
| `npm run db:studio` | Prisma Studio |

## Licencia

Privado / uso interno del proyecto salvo que definas otra licencia.
