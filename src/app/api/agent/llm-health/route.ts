import { NextResponse } from "next/server";

const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const LLM_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

/**
 * GET /api/agent/llm-health
 * Lightweight health check that sends a minimal request to the LLM
 * and returns 200 if reachable, 502 otherwise.
 */
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(NVIDIA_NIM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { ok: false, status: res.status, detail: body.slice(0, 300) },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, model: LLM_MODEL });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
