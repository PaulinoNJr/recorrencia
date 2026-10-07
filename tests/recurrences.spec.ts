import { test, expect } from "@playwright/test";
test("cliente aprende e escolhe os produtos da assinatura", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/recorrencias");
  await expect(
    page.getByRole("heading", { name: "Sua assinatura em 3 passos" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quero criar minha assinatura" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-subscription-source.png`,
  });
  await page.getByRole("button", { name: /Do meu carrinho atual/ }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
  );
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "Monte sua assinatura" }),
  ).toBeVisible();
  await page.goto("/recorrencias");
  await page
    .getByRole("button", { name: "Quero criar minha assinatura", exact: true })
    .click();
  await page.getByRole("button", { name: /Do catálogo de produtos/ }).click();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page
    .getByRole("searchbox", { name: "Buscar no catálogo de produtos" })
    .fill("leite");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("searchbox", { name: "Buscar no catálogo de produtos" })
    .fill("xyz-inexistente");
  await expect(
    page.getByRole("heading", { name: "Nenhum produto encontrado" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver todos os produtos", exact: true })
    .click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
    ),
  ).toEqual(before);
  await page.reload();
  await expect(
    page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await expect(page).toHaveURL("/assinatura/entrega");
  expect(errors).toEqual([]);
});
