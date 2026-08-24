/**
 * Server-side LiveKit token generator.
 * Uses livekit-server-sdk to create JWT tokens for room access.
 * This keeps the API secret server-side (never exposed to client).
 */

import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

/**
 * Generates a LiveKit access token for a student to join the Edy voice room.
 * @param studentId - The student's UUID
 * @param roomName - The room to join (default: "edtech-widget")
 * @returns JWT token string
 */
export async function generateLiveKitToken(
  studentId: string,
  roomName = "edtech-widget",
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set");
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: `student-${studentId}`,
    name: `Estudiante ${studentId.slice(0, 8)}`,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}
