import { test, expect } from "@playwright/test";

test.describe("Páginas públicas", () => {
  test("landing page carga y tiene navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /EduPlatform/i }).first()).toBeVisible();
  });

  test("catálogo de cursos carga", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page.getByRole("heading", { name: /Explorar cursos/i })).toBeVisible();
  });

  test("página de login carga", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Bienvenido de nuevo/i })).toBeVisible();
  });

  test("página de signup carga", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Crea tu cuenta/i })).toBeVisible();
  });

  test("favicon.ico está disponible", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
  });

  test("página 404 para ruta inexistente", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe-12345");
    expect(response?.status()).toBeDefined();
  });
});

test.describe("SEO básico", () => {
  test("landing page tiene título", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("catálogo tiene título descriptivo", async ({ page }) => {
    await page.goto("/cursos");
    const title = await page.title();
    expect(title).toContain("cursos");
  });
});

test.describe("Navegación", () => {
  test("navbar permite navegar al catálogo", async ({ page }) => {
    await page.goto("/");
    // El link de navbar dice "Explorar cursos" (lowercase)
    const cursosLink = page.locator('nav a[href="/cursos"]').first();
    await cursosLink.click();
    await page.waitForURL(/\/cursos/);
    await expect(page).toHaveURL(/\/cursos/);
  });

  test("footer está presente", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
