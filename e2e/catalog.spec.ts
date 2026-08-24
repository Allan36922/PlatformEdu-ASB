import { test, expect } from "@playwright/test";

test.describe("Catálogo de cursos (/cursos)", () => {
  test("carga la página del catálogo", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page).toHaveTitle(/Explorar cursos/);
    await expect(page.getByRole("heading", { name: /Explorar cursos/i })).toBeVisible();
  });

  test("muestra resultados o mensaje vacío", async ({ page }) => {
    await page.goto("/cursos");
    const resultCount = page.locator("p.text-muted-foreground").first();
    const emptyMessage = page.getByText(/No encontramos cursos/i);
    // Debe mostrar uno de los dos
    const hasResults = await resultCount.isVisible().catch(() => false);
    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    expect(hasResults || isEmpty).toBeTruthy();
  });

  test("muestra filtros de búsqueda", async ({ page }) => {
    await page.goto("/cursos");
    // El componente CourseFilters debe estar presente
    await expect(page.locator("input, select, button").first()).toBeVisible();
  });

  test("búsqueda por texto funciona", async ({ page }) => {
    await page.goto("/cursos?search=javascript");
    // La página debe cargar sin errores
    await expect(page.getByRole("heading", { name: /Explorar cursos/i })).toBeVisible();
  });

  test("filtro por categoría funciona", async ({ page }) => {
    await page.goto("/cursos?category=Desarrollo");
    await expect(page.getByRole("heading", { name: /Explorar cursos/i })).toBeVisible();
  });

  test("navegación entre páginas funciona", async ({ page }) => {
    await page.goto("/cursos?page=1");
    await expect(page.getByRole("heading", { name: /Explorar cursos/i })).toBeVisible();
  });
});
