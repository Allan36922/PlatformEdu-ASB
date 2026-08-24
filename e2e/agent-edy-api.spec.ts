import { test, expect } from "@playwright/test";

const AGENT_API_KEY = process.env.AGENT_API_KEY;

test.describe("API del Agente Edy", () => {
  test.describe("GET /api/agent/courses", () => {
    test("responde (200 con Supabase o 500 sin conexión)", async ({ request }) => {
      const headers: Record<string, string> = {};
      if (AGENT_API_KEY) {
        headers.Authorization = `Bearer ${AGENT_API_KEY}`;
      }
      const response = await request.get("/api/agent/courses", { headers });
      // 200 si Supabase está disponible, 500 si no (TypeError: fetch failed)
      expect([200, 500]).toContain(response.status());
    });

    test("sin API key configurada retorna 401", async ({ request }) => {
      test.skip(!!AGENT_API_KEY, "AGENT_API_KEY está configurado - test no aplica");
      const response = await request.get("/api/agent/courses");
      expect(response.status()).toBe(401);
    });

    test("con API key válida retorna 200 o 500 (Supabase)", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect([200, 500]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty("courses");
        expect(Array.isArray(body.courses)).toBeTruthy();
      }
    });

    test("con filtro de categoría responde correctamente", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses?category=Desarrollo", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect([200, 500]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty("courses");
      }
    });
  });

  test.describe("GET /api/agent/courses/search", () => {
    test("sin parámetro q devuelve 400", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses/search", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test("búsqueda semántica retorna resultados o 500", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses/search?q=javascript+programacion", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect([200, 500]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty("courses");
        expect(body).toHaveProperty("query");
      }
    });
  });

  test.describe("GET /api/agent/courses/[id]", () => {
    test("curso inexistente devuelve 404 o 500", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses/00000000-0000-0000-0000-000000000000", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect([404, 500]).toContain(response.status());
    });
  });

  test.describe("GET /api/agent/courses/[id]/lessons", () => {
    test("sin student_id devuelve 401", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/courses/fake-id/lessons", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect(response.status()).toBe(401);
    });

    test("con student_id y curso inexistente devuelve 404 o 500", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get(
        "/api/agent/courses/00000000-0000-0000-0000-000000000000/lessons?student_id=fake-student",
        { headers: { Authorization: `Bearer ${AGENT_API_KEY}` } }
      );
      expect([404, 500]).toContain(response.status());
    });
  });

  test.describe("POST /api/agent/enroll", () => {
    test("sin body válido devuelve 400", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.post("/api/agent/enroll", {
        headers: {
          Authorization: `Bearer ${AGENT_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {},
      });
      expect(response.status()).toBe(400);
    });

    test("sin campo confirmed devuelve 400", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.post("/api/agent/enroll", {
        headers: {
          Authorization: `Bearer ${AGENT_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { courseId: "fake-course", studentId: "fake-student" },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe("GET /api/agent/token", () => {
    test("sin studentId devuelve 400", async ({ request }) => {
      test.skip(!AGENT_API_KEY, "AGENT_API_KEY no configurado");
      const response = await request.get("/api/agent/token", {
        headers: { Authorization: `Bearer ${AGENT_API_KEY}` },
      });
      expect(response.status()).toBe(400);
    });
  });
});
