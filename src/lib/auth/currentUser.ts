import { requireSession } from "@/lib/auth/server";
import type { SessionUser } from "@/types";

/**
 * Punto único para obtener la sesión autenticada en server code.
 * Reemplazá el cuerpo si migrás a otro proveedor de auth; las APIs deben seguir usando esto o `requireSession`.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  return requireSession();
}
