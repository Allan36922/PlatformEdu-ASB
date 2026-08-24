/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// supabase/functions/embed-course/index.ts
//
// Invoked by the `courses_generate_embedding` trigger
// (supabase/migrations/0005_embeddings.sql) via pg_net when a course is
// inserted as published or transitions from draft to published.
// Generates the embedding via NVIDIA NIM API (nvidia/nv-embedqa-e5-v5, 384 dims)
// and updates `courses.embedding` with the admin client (service role).

import { createClient } from "npm:@supabase/supabase-js@2";

const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";
const EMBEDDING_DIM = 1024;

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

function buildEmbeddingText(course: CourseRow, sections: SectionRow[]): string {
  const parts = [
    course.title,
    course.description,
    LEVEL_LABEL[course.level] ?? course.level,
    course.category,
    ...sections.flatMap((section) => [
      section.title,
      ...section.lessons.map((lesson) => lesson.title),
    ]),
  ];
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get("NVIDIA_NIM_API_KEY");
  if (!apiKey) {
    console.error("NVIDIA_NIM_API_KEY no configurado");
    return null;
  }

  try {
    const response = await fetch(NVIDIA_NIM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: [text],
        model: EMBEDDING_MODEL,
        input_type: "query",
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA NIM error:", response.status, errText);
      return null;
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      console.error("Respuesta inválida de NVIDIA NIM:", data);
      return null;
    }

    // Truncate or pad to EMBEDDING_DIM if needed
    return embedding.slice(0, EMBEDDING_DIM);
  } catch (err) {
    console.error("Error llamando NVIDIA NIM:", err);
    return null;
  }
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

  const text = buildEmbeddingText(
    course,
    (sectionsRaw ?? []) as unknown as SectionRow[],
  );

  const embedding = await generateEmbedding(text);
  if (!embedding) {
    return json({ error: "No se pudo generar el embedding" }, 500);
  }

  const { error: updateError } = await supabaseAdmin
    .from("courses")
    .update({ embedding })
    .eq("id", courseId);

  if (updateError) {
    console.error("No se pudo guardar el embedding del curso", updateError);
    return json({ error: updateError.message }, 500);
  }

  return json({ ok: true, model: EMBEDDING_MODEL, dims: embedding.length });
});
