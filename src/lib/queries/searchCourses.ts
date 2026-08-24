import { createClient } from "@/lib/supabase/server";
import { COURSE_WITH_INSTRUCTOR_SELECT } from "@/lib/queries/courses";
import type { CourseWithInstructor } from "@/types/database";
import { generateLocalEmbedding, cosineSimilarity } from "@/lib/utils/localEmbeddings";

/**
 * Pide el embedding de un texto libre a la Edge Function "embed-text", que
 * corre el mismo modelo gratuito (gte-small) usado para embeber los cursos
 * (ver trigger en supabase/migrations/0005_embeddings.sql), así ambos
 * vectores viven en el mismo espacio y son comparables por distancia coseno.
 * Si falla, usa embeddings locales como fallback para desarrollo.
 */
async function getQueryEmbedding(query: string): Promise<number[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Intentar con Edge Function primero (producción)
  if (supabaseUrl && serviceRoleKey) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/embed-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ text: query, model: "gte-small" }),
      });
      if (response.ok) {
        const { embedding } = (await response.json()) as { embedding?: number[] };
        if (embedding) return embedding;
      }
    } catch (err) {
      console.warn("Edge Function embed-text no disponible, usando fallback local:", err);
    }
  }
  
  // Fallback: embedding local determinista (solo para desarrollo/testing)
  return generateLocalEmbedding(query);
}

/**
 * Búsqueda semántica de cursos: solo cursos publicados, ordenados por
 * similitud de embeddings (distancia coseno) contra el texto de `query`.
 * Usa la función `match_courses` (supabase/migrations/0006_match_courses.sql)
 * cuando los embeddings son reales (gte-small). Con embeddings locales
 * hace la búsqueda en memoria como fallback.
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
  
  // Intentar búsqueda vía RPC match_courses (producción con embeddings reales)
  const { data: matches, error: matchError } = (await supabase.rpc("match_courses", {
    query_embedding: embedding,
    match_count: limit,
  })) as { data: { id: string; similarity: number }[] | null; error: unknown };

  // Si la RPC funciona y devuelve resultados, usarla
  if (!matchError && matches && matches.length > 0) {
    const ids = matches.map((match) => match.id);
    const { data: courses } = await supabase
      .from("courses")
      .select(COURSE_WITH_INSTRUCTOR_SELECT)
      .in("id", ids);

    const byId = new Map(
      ((courses ?? []) as unknown as CourseWithInstructor[]).map((course) => [course.id, course]),
    );

    return ids.map((id) => byId.get(id)).filter((course): course is CourseWithInstructor => Boolean(course));
  }

  // Fallback: búsqueda local en memoria (desarrollo con embeddings locales)
  console.warn("Usando búsqueda semántica local como fallback");
  const { data: courses } = await supabase
    .from("courses")
    .select("id, embedding")
    .eq("status", "published")
    .not("embedding", "is", null);

  if (!courses || courses.length === 0) return [];

  const matchesLocal = courses
    .filter((c): c is { id: string; embedding: number[] } => Boolean(c.embedding))
    .map((course) => ({
      id: course.id,
      similarity: cosineSimilarity(embedding, course.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  if (matchesLocal.length === 0) return [];

  const ids = matchesLocal.map((match) => match.id);
  const { data: fullCourses } = await supabase
    .from("courses")
    .select(COURSE_WITH_INSTRUCTOR_SELECT)
    .in("id", ids);

  const byId = new Map(
    ((fullCourses ?? []) as unknown as CourseWithInstructor[]).map((course) => [course.id, course]),
  );

  return ids.map((id) => byId.get(id)).filter((course): course is CourseWithInstructor => Boolean(course));
}
