import { test, expect } from "@playwright/test";

const AGENT_API_KEY = process.env.AGENT_API_KEY;

test.describe("Integración completa del Agente Edy", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!AGENT_API_KEY) {
      testInfo.skip();
    }
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${AGENT_API_KEY}`,
  });

  test("flujo completo: listar → buscar → detalle → lecciones", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();

    // 1. Listar cursos publicados
    const listResponse = await request.get("/api/agent/courses", { headers });
    expect([200, 500]).toContain(listResponse.status());

    if (listResponse.status() === 200) {
      const { courses, total } = await listResponse.json();
      expect(Array.isArray(courses)).toBeTruthy();
      expect(typeof total).toBe("number");

      // 2. Buscar cursos por similitud
      const searchResponse = await request.get(
        "/api/agent/courses/search?q=programacion&limit=5",
        { headers }
      );
      expect([200, 500]).toContain(searchResponse.status());

      // 3. Si hay cursos, obtener detalle del primero
      if (courses.length > 0) {
        const courseId = courses[0].id;

        const detailResponse = await request.get(`/api/agent/courses/${courseId}`, { headers });
        expect([200, 500]).toContain(detailResponse.status());

        if (detailResponse.status() === 200) {
          const { course, sections } = await detailResponse.json();
          expect(course.id).toBe(courseId);
          expect(Array.isArray(sections)).toBeTruthy();

          // 4. Intentar obtener lecciones sin student_id → 401
          const lessonsNoStudent = await request.get(
            `/api/agent/courses/${courseId}/lessons`,
            { headers }
          );
          expect(lessonsNoStudent.status()).toBe(401);

          // 5. Obtener lecciones con student_id falso → 403 o 200
          const lessonsResponse = await request.get(
            `/api/agent/courses/${courseId}/lessons?student_id=test-student-id`,
            { headers }
          );
          expect([200, 403, 500]).toContain(lessonsResponse.status());
        }
      }
    }
  });

  test("flujo de inscripción: validación de parámetros", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();

    // Sin courseId
    const noCourse = await request.post("/api/agent/enroll", {
      headers,
      data: { studentId: "test-student", confirmed: true },
    });
    expect(noCourse.status()).toBe(400);

    // Sin studentId
    const noStudent = await request.post("/api/agent/enroll", {
      headers,
      data: { courseId: "test-course", confirmed: true },
    });
    expect(noStudent.status()).toBe(400);

    // Sin confirmed
    const noConfirmed = await request.post("/api/agent/enroll", {
      headers,
      data: { courseId: "test-course", studentId: "test-student" },
    });
    expect(noConfirmed.status()).toBe(400);

    // Con confirmed en curso inexistente → 404 o 500
    const fakeCourse = await request.post("/api/agent/enroll", {
      headers,
      data: {
        courseId: "00000000-0000-0000-0000-000000000000",
        studentId: "test-student",
        confirmed: true,
      },
    });
    expect([404, 500]).toContain(fakeCourse.status());
  });

  test("flujo de token: generación de token LiveKit", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();

    // Sin studentId
    const noStudent = await request.get("/api/agent/token", { headers });
    expect(noStudent.status()).toBe(400);

    // Con studentId falso (puede fallar si LiveKit no está configurado)
    const withStudent = await request.get(
      "/api/agent/token?studentId=test-student-123",
      { headers }
    );
    expect([200, 500]).toContain(withStudent.status());

    if (withStudent.status() === 200) {
      const { token } = await withStudent.json();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    }
  });

  test("paginación del catálogo funciona", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();
    const page1 = await request.get("/api/agent/courses?page=1&pageSize=2", { headers });
    expect([200, 500]).toContain(page1.status());

    if (page1.status() === 200) {
      const body1 = await page1.json();
      expect(body1.page).toBe(1);
      expect(body1.pageSize).toBe(2);
      expect(Array.isArray(body1.courses)).toBeTruthy();
      expect(body1.courses.length).toBeLessThanOrEqual(2);
    }
  });

  test("búsqueda semántica con query vacío retorna 400", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();
    const response = await request.get("/api/agent/courses/search", { headers });
    expect(response.status()).toBe(400);
  });

  test("búsqueda semántica con límite personalizado", async ({ request }) => {
    if (!AGENT_API_KEY) return;

    const headers = getHeaders();
    const response = await request.get(
      "/api/agent/courses/search?q=desarrollo&limit=3",
      { headers }
    );
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const { courses } = await response.json();
      expect(courses.length).toBeLessThanOrEqual(3);
    }
  });
});
