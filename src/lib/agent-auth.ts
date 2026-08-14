import { NextResponse } from "next/server";

/**
 * Verifica el header Authorization: Bearer <AGENT_API_KEY> que envía el
 * agente de voz Edy (backend_client.py) en cada llamada a /api/agent/*.
 * Devuelve una NextResponse de error si la verificación falla, o null si
 * la request está autorizada.
 */
export function checkAgentAuth(request: Request): NextResponse | null {
  const secret = process.env.AGENT_API_KEY;
  if (!secret) {
    return NextResponse.json({ error: "AGENT_API_KEY no configurado" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}
