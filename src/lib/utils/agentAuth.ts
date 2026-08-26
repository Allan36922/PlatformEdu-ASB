import { NextRequest, NextResponse } from "next/server";

const AGENT_API_KEY = process.env.AGENT_API_KEY;

export function validateAgentRequest(request: NextRequest): NextResponse | null {
  if (!AGENT_API_KEY) {
    console.warn("AGENT_API_KEY no configurado - permitiendo acceso en desarrollo");
    return null;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No autorizado - se requiere Authorization: Bearer <AGENT_API_KEY>" },
      { status: 401 }
    );
  }

  const providedKey = authHeader.slice(7);
  if (providedKey !== AGENT_API_KEY) {
    return NextResponse.json(
      { error: "API Key inválida" },
      { status: 401 }
    );
  }

  return null;
}