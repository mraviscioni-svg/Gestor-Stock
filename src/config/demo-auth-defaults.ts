/**
 * Credenciales por defecto del usuario demo y del SUPER_ADMIN de plataforma (MVP).
 * Se persisten en la DB como hash al correr seed / POST /api/internal/bootstrap.
 * El login usa **username** + contraseña (no email).
 */
export const DEMO_OWNER_USERNAME = "dueno";

export const DEMO_CASHIER_USERNAME = "cajero";

export const DEMO_OWNER_PASSWORD = "GestorDemo2026!";

export const DEMO_TENANT_SLUG = "demo-kiosco";

/** Emails legados solo para migración / contacto en seed. */
export const DEMO_OWNER_EMAIL = "owner@demo.gestor.stock";
export const LEGACY_DEMO_OWNER_EMAIL = "owner@demo.kiosco.local";

export const PLATFORM_SUPER_ADMIN_USERNAME = "admin";

export const PLATFORM_SUPER_ADMIN_PASSWORD = "ChangeMePlatform2026!";

export const PLATFORM_SUPER_ADMIN_EMAIL = "admin@gestor.platform";
