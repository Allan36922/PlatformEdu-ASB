/**
 * Chat API for Edy agent - simplified flow for fast responses.
 *
 * Flow:
 * 1. Search courses matching the user message
 * 2. Pass results as context to LLM
 * 3. LLM generates a natural language response
 *
 * This avoids slow tool-calling loops with NVIDIA NIM.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCoursesBySimilarity } from "@/lib/queries/searchCourses";

const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const LLM_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

const SYSTEM_PROMPT = `Eres Edy, el asistente virtual de EduPlatform (plataforma de cursos online en español).

Responde siempre en español, sé cálido y profesional. Sé conciso (máx 150 palabras).

Tienes acceso a información de cursos reales del catálogo. Úsala para responder.
Si un curso es de pago, aclara que el link de checkout es SIMULADO (no hay cobro real aún).
Si el usuario quiere inscribirse, dile que vaya a http://localhost:3000/cursos para ver los cursos.`;

export async function POST(request: NextRequest) {
  try {
    await createClient();

    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM no configurado" }, { status: 500 });
    }

    // Step 1: Search for relevant courses
    let courseContext = "";
    try {
      const courses = await searchCoursesBySimilarity(message, 5);
      if (courses.length > 0) {
        courseContext =
          "\n\nCursos disponibles relevantes:\n" +
          courses
            .map(
              (c) =>
                `- ${c.title} (${c.category}, ${c.level}) - $${c.price || 0} - ID: ${c.id}`,
            )
            .join("\n");
      }
    } catch {
      // Search failed, continue without course context
    }

    // Step 2: Also check for categories if the user asks about them
    if (
      message.toLowerCase().includes("categoría") ||
      message.toLowerCase().includes("categorias") ||
      message.toLowerCase().includes("qué hay") ||
      message.toLowerCase().includes("que hay")
    ) {
      const categories = [
        "Desarrollo Web",
        "Ciencia de Datos",
        "Diseño",
        "Negocios",
        "Marketing",
        "Idiomas",
        "Productividad",
        "Fotografía y Video",
        "Música",
        "Desarrollo Personal",
      ];
      courseContext += "\n\nCategorías disponibles: " + categories.join(", ");
    }

    // Step 3: Call LLM with context
    const messages = [
      { role: "system", content: SYSTEM_PROMPT + courseContext },
      ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const response = await fetch(NVIDIA_NIM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM error:", response.status, errText.substring(0, 200));
      return NextResponse.json({ error: "Error del LLM" }, { status: 500 });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      response: assistantMessage,
      history: [
        ...history.slice(-6),
        { role: "user", content: message },
        { role: "assistant", content: assistantMessage },
      ],
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Error procesando tu mensaje" },
      { status: 500 },
    );
  }
}
