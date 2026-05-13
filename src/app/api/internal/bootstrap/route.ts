import { NextResponse } from "next/server";
import { runDemoSeed } from "@/lib/seed-demo";

/**
 * One-shot demo seed for Vercel: creates tables data (user + tenant + products).
 * Protect with BOOTSTRAP_SECRET; remove secret from Vercel after calling once.
 */
export async function POST(req: Request) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json(
      { error: "BOOTSTRAP_SECRET no configurado o demasiado corto (min 16 chars)" },
      { status: 503 }
    );
  }

  const header = req.headers.get("x-bootstrap-secret");
  if (header !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const out = await runDemoSeed({ disconnect: false });
    const email = out.ownerEmail;
    return NextResponse.json({
      ok: true,
      message:
        "Seed aplicado. Iniciá sesión con las credenciales demo (email y clave en src/config/demo-auth-defaults.ts y en pantalla de login).",
      ownerEmail: email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al ejecutar seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
