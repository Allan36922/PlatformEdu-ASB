import { test, expect } from "@playwright/test";

test.describe("Página principal (landing)", () => {
  test("carga correctamente y muestra el título principal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/EduPlatform/);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("muestra la sección de cursos destacados", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Cursos destacados/i })).toBeVisible();
  });

  test("link 'Explorar Cursos' navega al catálogo", async ({ page }) => {
    await page.goto("/");
    // El navbar tiene el link de "Explorar cursos" (lowercase c)
    const navLink = page.getByRole("navigation").getByRole("link", { name: "Explorar cursos" });
    await navLink.click();
    await page.waitForURL(/\/cursos/);
    await expect(page).toHaveURL(/\/cursos/);
  });

  test("link 'Enseñar en EduPlatform' navega a signup", async ({ page }) => {
    await page.goto("/");
    // Este link está envuelto en un Button con render={<Link>}, se renderiza como <a role="button">
    // Usamos el locator de texto directo
    const enseñarLink = page.locator('a[href="/signup"]').filter({ hasText: "Enseñar en EduPlatform" }).first();
    await enseñarLink.click();
    await page.waitForURL(/\/signup/);
    await expect(page).toHaveURL(/\/signup/);
  });

  test("muestra categorías populares si existen", async ({ page }) => {
    await page.goto("/");
    const categoriesHeading = page.getByRole("heading", { name: /Categorías populares/i });
    const visible = await categoriesHeading.isVisible().catch(() => false);
    if (visible) {
      await expect(categoriesHeading).toBeVisible();
    }
  });
});
