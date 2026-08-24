import { NextRequest, NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/utils/agentAuth";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function GET(request: NextRequest) {
  const authError = validateAgentRequest(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId requerido" }, { status: 400 });
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json(
      { error: "Credenciales de LiveKit no configuradas" },
      { status: 500 }
    );
  }

  try {
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `student-${studentId}`,
      name: `Estudiante ${studentId.slice(0, 8)}`,
      ttl: "2h",
    });

    token.addGrant({
      roomJoin: true,
      room: "edtech-widget",
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({ token: jwt });
  } catch (err) {
    console.error("Error generando token LiveKit:", err);
    return NextResponse.json({ error: "Error generando token" }, { status: 500 });
  }
}