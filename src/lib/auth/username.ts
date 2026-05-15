import { z } from "zod";

/** Normaliza usuario de login (minúsculas, sin espacios). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export const usernameFieldSchema = z
  .string()
  .min(3, "Mínimo 3 caracteres")
  .max(32, "Máximo 32 caracteres")
  .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guión y guión bajo")
  .transform(normalizeUsername);
