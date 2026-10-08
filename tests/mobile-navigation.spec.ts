import { test, expect } from "@playwright/test";
test("navegacao mobile segue o Covabra e preserva acesso a recorrencia", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  const bottom = page.getByRole("navigation", { name: "Navegação mobile" });
  await expect(bottom).toBeVisible();
  await expect(page.locator(".department-navigation")).toBeHidden();
  const rect = await bottom.boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  await page.getByRole("button", { name: "Abrir menu de categorias" }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-categories-drawer.png" });
  await menu.getByRole("link", { name: /Recorrências Covabra/ }).click();
  await expect(page).toHaveURL("/recorrencias");
  await expect(menu).toHaveCount(0);
  await bottom.getByRole("button", { name: "Categorias" }).click();
  await menu.getByRole("link", { name: "Mercearia", exact: true }).click();
  await expect(page).toHaveURL(/categoria=Mercearia/);
  await bottom.getByRole("link", { name: "Cupons" }).click();
  await expect(page).toHaveURL("/cupons");
  await bottom.getByRole("link", { name: "Início" }).click();
  const shelf = page.locator(".home-product-grid").first();
  expect(await shelf.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await shelf.evaluate((el) => {
    el.scrollLeft = 180;
  });
  expect(await shelf.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await bottom.getByRole("link", { name: "Carrinho" }).click();
  await expect(page).toHaveURL("/carrinho");
  await expect(bottom).toHaveCount(0);
});
