/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// supabase/functions/embed-text/index.ts
//
// Genera el embedding (gte-small, 384 dims, mismo modelo que embed-course)
// de un texto libre de consulta. Usado por searchCoursesBySimilarity
// (src/lib/queries/searchCourses.ts) para buscar cursos por similitud
// coseno contra courses.embedding vía la función match_courses
// (supabase/migrations/0006_match_courses.sql).

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

  let text: string | undefined;
  try {
    ({ text } = await req.json());
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!text || !text.trim()) {
    return json({ error: "Falta text" }, 400);
  }

  const model = new Supabase.ai.Session("gte-small");
  const embedding = await model.run(text, { mean_pool: true, normalize: true });

  return json({ embedding });
});
