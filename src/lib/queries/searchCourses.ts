import { createClient } from "@/lib/supabase/server";
import { COURSE_WITH_INSTRUCTOR_SELECT } from "@/lib/queries/courses";
import type { CourseWithInstructor } from "@/types/database";

/**
 * Pide el embedding de un texto libre a la Edge Function "embed-text", que
 * corre el mismo modelo gratuito (gte-small) usado para embeber los cursos
 * (ver trigger en supabase/migrations/0005_embeddings.sql), así ambos
 * vectores viven en el mismo espacio y son comparables por distancia coseno.
 */
async function getQueryEmbedding(query: string): Promise<number[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/embed-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ text: query, model: "gte-small" }),
    });
    if (!response.ok) return null;

    const { embedding } = (await response.json()) as { embedding?: number[] };
    return embedding ?? null;
  } catch (err) {
    console.error("No se pudo generar el embedding de búsqueda", err);
    return null;
  }
}

/**
 * Búsqueda semántica de cursos: solo cursos publicados, ordenados por
 * similitud de embeddings (distancia coseno) contra el texto de `query`.
 * Usa la función `match_courses` (supabase/migrations/0006_match_courses.sql),
 * que ya filtra por status = 'published' en la base de datos.
 */
export async function searchCoursesBySimilarity(
  query: string,
  limit = 10,
): Promise<CourseWithInstructor[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const embedding = await getQueryEmbedding(trimmed);
  if (!embedding) return [];

  const supabase = await createClient();
  const { data: matches, error: matchError } = (await supabase.rpc("match_courses", {
    query_embedding: embedding,
    match_count: limit,
  })) as { data: { id: string; similarity: number }[] | null; error: unknown };

  if (matchError || !matches || matches.length === 0) return [];

  const ids = matches.map((match) => match.id);
  const { data: courses } = await supabase
    .from("courses")
    .select(COURSE_WITH_INSTRUCTOR_SELECT)
    .in("id", ids);

  const byId = new Map(
    ((courses ?? []) as unknown as CourseWithInstructor[]).map((course) => [course.id, course]),
  );

  // Reordena según la similitud devuelta por match_courses (.in() no garantiza el orden).
  return ids.map((id) => byId.get(id)).filter((course): course is CourseWithInstructor => Boolean(course));
}
