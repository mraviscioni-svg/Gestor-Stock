/**
 * Credenciales por defecto del usuario demo (MVP).
 * Se persisten en la DB como hash al correr seed / POST /api/internal/bootstrap.
 * No se leen de variables de entorno.
 *
 * Si exponés la contraseña en la UI de login, quedará en el bundle del cliente;
 * para producción real usá otro flujo de alta de usuarios.
 */
export const DEMO_OWNER_EMAIL = "owner@demo.gestor.stock";

/** Email usado en seeds anteriores; el login y el seed lo contemplan por compatibilidad. */
export const LEGACY_DEMO_OWNER_EMAIL = "owner@demo.kiosco.local";

export const DEMO_OWNER_PASSWORD = "GestorDemo2026!";

export const DEMO_TENANT_SLUG = "demo-kiosco";
