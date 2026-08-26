import { NextResponse } from "next/server";

const NVIDIA_NIM_BASE = "https://integrate.api.nvidia.com/v1";
const LLM_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

/**
 * GET /api/agent/llm-health
 * Lightweight check: verifies the API key is configured and the
 * NVIDIA NIM endpoint is reachable (models list — no LLM inference).
 */
export async function GET() {
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.NVIDIA_NIM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "NVIDIA_NIM_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    // Use the models endpoint — lightweight, no inference cost
    const res = await fetch(`${NVIDIA_NIM_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { ok: false, status: res.status, detail: body.slice(0, 300) },
        { status: 502 },
      );
    }

    // Also verify our specific model is listed
    const data = await res.json();
    const models = data?.data ?? [];
    const modelFound = models.some(
      (m: { id?: string }) => m.id === LLM_MODEL,
    );

    if (!modelFound) {
      return NextResponse.json(
        {
          ok: false,
          error: `Model ${LLM_MODEL} not found in available models`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, model: LLM_MODEL });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
