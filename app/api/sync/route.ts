import { NextResponse } from "next/server";

/**
 * Local fallback when Supabase is not configured.
 * Acknowledges the mutation so the device can mark it as synced.
 * Clinic data remains isolated in each device's IndexedDB until a backend is connected.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    mode: "local",
    id: body.id,
    receivedAt: new Date().toISOString(),
  });
}
