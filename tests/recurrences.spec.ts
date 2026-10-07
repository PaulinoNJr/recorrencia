import { test, expect } from "@playwright/test";
test("cliente aprende sobre recorrência e inicia pelo carrinho", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Recorrências", exact: true }).click();
  await expect(page).toHaveURL("/recorrencias");
  await expect(
    page.getByRole("heading", { name: "Sua assinatura em 3 passos" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Veja como funciona" }).click();
  await expect(page).toHaveURL(/#como-funciona$/);
  await page
    .locator("summary")
    .filter({ hasText: "Preciso incluir todos os produtos do carrinho?" })
    .click();
  await expect(
    page.getByText("Os demais continuam no carrinho", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-recorrencias.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Quero criar minha assinatura" })
    .click();
  await expect(page).toHaveURL("/carrinho");
  await expect(
    page.getByRole("button", { name: "Criar assinatura", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
