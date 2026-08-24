import { searchCoursesBySimilarity } from "@/lib/queries/searchCourses";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/utils/agentAuth";

export async function GET(request: NextRequest) {
  const authError = validateAgentRequest(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!q) {
    return NextResponse.json({ error: "Parámetro 'q' requerido" }, { status: 400 });
  }

  try {
    const courses = await searchCoursesBySimilarity(q, limit);
    // Strip embeddings from response (they're huge and not needed by the client)
    const cleaned = courses.map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { embedding, ...rest } = c as unknown as Record<string, unknown>;
      return rest;
    });
    return NextResponse.json({ courses: cleaned, query: q });
  } catch (err) {
    console.error("Error en búsqueda semántica:", err);
    return NextResponse.json({ error: "Error en búsqueda" }, { status: 500 });
  }
}