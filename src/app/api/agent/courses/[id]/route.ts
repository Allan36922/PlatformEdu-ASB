import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/utils/agentAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateAgentRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*, instructor:profiles(id, full_name, avatar_url, headline, bio)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  const { data: sectionsRaw } = await supabase
    .from("sections")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("position", { ascending: true });

  const sections = (sectionsRaw ?? []).map((section) => ({
    ...section,
    lessons: [...(((section as unknown as { lessons: { id: string; title: string; type: string; position: number; is_free_preview: boolean }[] }).lessons) ?? [])].sort(
      (a, b) => a.position - b.position,
    ),
  }));

  return NextResponse.json({ course, sections });
}