import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "gestor-de-stock",
    time: new Date().toISOString(),
  });
}
