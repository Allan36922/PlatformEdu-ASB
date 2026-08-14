import { NextResponse } from "next/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

/**
 * Emite tokens de LiveKit para el widget de voz embebido (/agente-edy vía
 * iframe). Si hay sesión de Supabase activa, la identity/metadata del token
 * es el usuario real; si no, se genera una identity anónima para que un
 * visitante sin cuenta también pueda hablar con Edy.
 */
export async function POST(request: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit no está configurado" }, { status: 500 });
  }

  let body: { room?: string; studentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const room = body.room;
  if (!room) {
    return NextResponse.json({ error: "Falta room" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const studentId = body.studentId ?? undefined;
  const identity = user?.id ?? studentId ?? `anon-${crypto.randomUUID()}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    metadata: JSON.stringify({ studentId: user?.id ?? studentId ?? null }),
    ttl: "10m",
  });
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  // Dispatch explícito: el worker de AgentEdy se registra con
  // agent_name="edy" (ver main.py), así que sin esto LiveKit crea la sala
  // pero nunca invoca al agente.
  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: "edy" })],
  });

  return NextResponse.json({ token: await token.toJwt() });
}
