import { test, expect } from "@playwright/test";

test.describe("Página del Agente Edy (/agente-edy)", () => {
  test("sin sesión redirige a login", async ({ page }) => {
    await page.goto("/agente-edy");
    // Sin autenticación, el middleware redirige a login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Widget launcher", () => {
  test("botón de Edy está presente en el layout principal", async ({ page }) => {
    await page.goto("/");
    const edyButton = page.getByRole("button", { name: /Hablar con Edy/i });
    await expect(edyButton).toBeVisible();
  });

  test("click en botón abre/cierra el panel", async ({ page }) => {
    await page.goto("/");
    const edyButton = page.getByRole("button", { name: /Hablar con Edy/i });

    // Abrir
    await edyButton.click();
    const iframe = page.locator('iframe[title*="Edy"]');
    await expect(iframe).toBeVisible({ timeout: 5000 });

    // Cerrar
    const closeButton = page.getByRole("button", { name: /Cerrar a Edy/i });
    await closeButton.click();
    await expect(iframe).not.toBeVisible();
  });
});
