import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("página de login carga correctamente", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Bienvenido de nuevo/i })).toBeVisible();
  });

  test("página de signup carga correctamente", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Crea tu cuenta/i })).toBeVisible();
  });
});

test.describe("Rutas protegidas", () => {
  const protectedRoutes = [
    "/instructor",
    "/estudiante",
    "/aprender/fake-course-id/fake-lesson-id",
    "/checkout/fake-course-id",
  ];

  for (const route of protectedRoutes) {
    test(`redirige a login desde ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
      await expect(page).toHaveURL(new RegExp(`redirect=${encodeURIComponent(route)}`));
    });
  }
});
