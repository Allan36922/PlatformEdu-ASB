/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// supabase/functions/embed-text/index.ts
//
// Generates the embedding (NVIDIA NIM nvidia/nv-embedqa-e5-v5, 384 dims)
// of a free-text query. Used by searchCoursesBySimilarity
// (src/lib/queries/searchCourses.ts) to search courses by cosine similarity
// against courses.embedding via the match_courses function
// (supabase/migrations/0006_match_courses.sql).

const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";

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

  const apiKey = Deno.env.get("NVIDIA_NIM_API_KEY");
  if (!apiKey) {
    return json({ error: "NVIDIA_NIM_API_KEY no configurado" }, 500);
  }

  try {
    const response = await fetch(NVIDIA_NIM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: [text.trim()],
        model: EMBEDDING_MODEL,
        input_type: "query",
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA NIM error:", response.status, errText);
      return json({ error: `NVIDIA NIM error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return json({ error: "Respuesta inválida de NVIDIA NIM" }, 500);
    }

    return json({ embedding: embedding.slice(0, 1024) });
  } catch (err) {
    console.error("Error llamando NVIDIA NIM:", err);
    return json({ error: "Error generando embedding" }, 500);
  }
});
