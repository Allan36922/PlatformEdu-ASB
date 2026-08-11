/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// supabase/functions/embed-course/index.ts
//
// Invocada por el trigger `courses_generate_embedding`
// (supabase/migrations/0005_embeddings.sql) vía pg_net cuando un curso se
// inserta ya publicado o pasa de borrador a publicado. Genera el embedding
// con el modelo integrado y gratuito de Supabase (gte-small, 384 dims) y
// actualiza `courses.embedding` con el cliente admin (service role) — igual
// que enrollments/transactions/certificates, esta escritura solo puede
// hacerla el backend (ver notas de seguridad del README y RLS en 0002_rls.sql).

import { createClient } from "npm:@supabase/supabase-js@2";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  status: string;
}

interface SectionRow {
  title: string;
  lessons: { title: string }[];
}

/**
 * Arma el mismo texto que `buildCourseEmbeddingText` en
 * src/lib/queries/embeddings.ts (title + description + level + category +
 * títulos del temario). Se duplica aquí porque esta función corre en Deno,
 * aislada del código de la app Next.js — si cambias uno, actualiza el otro.
 */
function buildEmbeddingText(course: CourseRow, sections: SectionRow[]): string {
  const parts = [
    course.title,
    course.description,
    LEVEL_LABEL[course.level] ?? course.level,
    course.category,
    ...sections.flatMap((section) => [section.title, ...section.lessons.map((lesson) => lesson.title)]),
  ];
  return parts.filter((part): part is string => Boolean(part && part.trim())).join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let courseId: string | undefined;
  try {
    ({ courseId } = await req.json());
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!courseId) {
    return json({ error: "Falta courseId" }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, title, description, category, level, status")
    .eq("id", courseId)
    .maybeSingle<CourseRow>();

  if (courseError) {
    console.error("No se pudo leer el curso", courseError);
    return json({ error: courseError.message }, 500);
  }
  if (!course || course.status !== "published") {
    // El curso se despublicó (o se borró) entre el trigger y esta llamada: no hay nada que embeber.
    return json({ skipped: true });
  }

  const { data: sectionsRaw, error: sectionsError } = await supabaseAdmin
    .from("sections")
    .select("title, lessons(title)")
    .eq("course_id", courseId);

  if (sectionsError) {
    console.error("No se pudo leer el temario del curso", sectionsError);
    return json({ error: sectionsError.message }, 500);
  }

  const text = buildEmbeddingText(course, (sectionsRaw ?? []) as unknown as SectionRow[]);

  const model = new Supabase.ai.Session("gte-small");
  const embedding = await model.run(text, { mean_pool: true, normalize: true });

  const { error: updateError } = await supabaseAdmin
    .from("courses")
    .update({ embedding })
    .eq("id", courseId);

  if (updateError) {
    console.error("No se pudo guardar el embedding del curso", updateError);
    return json({ error: updateError.message }, 500);
  }

  return json({ ok: true });
});
