/**
 * Credenciales por defecto del usuario demo y del SUPER_ADMIN de plataforma (MVP).
 * Se persisten en la DB como hash al correr seed / POST /api/internal/bootstrap.
 * No se leen de variables de entorno (salvo DATABASE_URL / JWT_SECRET para la app).
 *
 * Si exponés la contraseña en la UI de login, quedará en el bundle del cliente;
 * para producción real usá otro flujo de alta de usuarios.
 */
export const DEMO_OWNER_EMAIL = "owner@demo.gestor.stock";

/** Email usado en seeds anteriores; el login y el seed lo contemplan por compatibilidad. */
export const LEGACY_DEMO_OWNER_EMAIL = "owner@demo.kiosco.local";

export const DEMO_OWNER_PASSWORD = "GestorDemo2026!";

export const DEMO_TENANT_SLUG = "demo-kiosco";

/** SUPER_ADMIN de plataforma (sin tenant). Mismo archivo que el demo; no se lee de env. */
export const PLATFORM_SUPER_ADMIN_EMAIL = "admin@gestor.platform";

export const PLATFORM_SUPER_ADMIN_PASSWORD = "ChangeMePlatform2026!";
