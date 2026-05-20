import { expect, test } from "@playwright/test";

test.describe("Homepage publique", () => {
  test("affiche le hero + barre de recherche", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/confiance/i);
    await expect(page.getByRole("button", { name: /Rechercher/i })).toBeVisible();
  });

  test("page SEO métier/ville avec canonical + JSON-LD", async ({ page }) => {
    const res = await page.goto("/plombier/nice");
    expect(res?.status()).toBeLessThan(400);

    await expect(page).toHaveTitle(/Plombier.*Nice/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/plombier\/nice$/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toContain("ItemList");
  });
});
