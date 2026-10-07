import { test, expect } from "@playwright/test";
test("página inicial e menu de Robson", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: "Covabra Supermercados" }),
  ).toBeAttached();
  await expect(
    page.getByRole("navigation", { name: "Categorias de produtos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Destaque Camil - Trade" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Próximo banner", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mostrar banner 2", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page
    .getByRole("button", { name: "Banner anterior", exact: true })
    .click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
  const trigger = page.getByRole("button", { name: "Menu de Robson" });
  await expect(
    page.locator("header nav").getByRole("link", { name: "Minhas listas" }),
  ).toHaveCount(0);
  await expect(
    page.locator("header nav").getByRole("link", { name: /Recorrências/ }),
  ).toHaveAttribute("href", "/recorrencias");
  if (testInfo.project.name === "desktop") await trigger.hover();
  else await trigger.tap();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Minhas listas", exact: true }),
  ).toBeVisible();
  const managementLink = page.locator("#robson-dropdown").getByRole("link", { name: /Recorrências/ });
  await expect(managementLink).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-robson-menu.png`,
  });
  await managementLink.click();
  await expect(page).toHaveURL(/minhas-assinaturas$/);
  await page.getByRole("link", { name: "Covabra início" }).click();
  await expect(page).toHaveURL("/");
  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(
    page.getByRole("link", { name: "Minhas listas", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await page.getByRole("link", { name: "Minhas listas", exact: true }).click();
  await expect(page).toHaveURL(/listas$/);
  expect(errors).toEqual([]);
});
