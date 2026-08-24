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
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json(
      { error: "Se requiere student_id para acceder a las lecciones" },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Verificar que el curso existe y está publicado
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, price")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (courseError || !course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  // Verificar inscripción (o si es gratis, permitir acceso)
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", id)
    .eq("student_id", studentId)
    .maybeSingle();

  const isFree = (course.price ?? 0) === 0;
  const isEnrolled = Boolean(enrollment);

  if (!isFree && !isEnrolled) {
    return NextResponse.json(
      { error: "No estás inscrito en este curso", requiresEnrollment: true, price: course.price },
      { status: 403 }
    );
  }

  // Obtener secciones y lecciones
  const { data: sectionsRaw, error: sectionsError } = await supabase
    .from("sections")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("position", { ascending: true });

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  const sections = (sectionsRaw ?? []).map((section) => ({
    ...section,
    lessons: [...(((section as unknown as { lessons: { id: string; title: string; type: string; content_url: string | null; content_text: string | null; duration_seconds: number; position: number; is_free_preview: boolean }[] }).lessons) ?? [])].sort(
      (a, b) => a.position - b.position,
    ),
  }));

  return NextResponse.json({ sections, isEnrolled, isFree });
}