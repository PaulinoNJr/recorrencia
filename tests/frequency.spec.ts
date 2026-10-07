import { test, expect } from "@playwright/test";
test("frequencia exige escolha explicita e remover pendencia libera continuar", async ({
  page,
}) => {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  const milk = page.getByRole("checkbox", {
    name: "Incluir Leite integral Shefa na assinatura",
  });
  const paper = page.getByRole("checkbox", {
    name: "Incluir Papel higiênico folha dupla na assinatura",
  });
  const next = page.getByRole("button", { name: "Continuar para entrega" });
  await milk.check();
  await paper.check();
  await expect(
    page.getByLabel("Frequência de Leite integral Shefa"),
  ).toHaveValue("");
  await expect(
    page.getByLabel("Frequência de Papel higiênico folha dupla"),
  ).toHaveValue("");
  await expect(next).toBeDisabled();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Toda semana");
  await expect(next).toBeDisabled();
  await page.reload();
  await expect(
    page.getByLabel("Frequência de Papel higiênico folha dupla"),
  ).toHaveValue("");
  await paper.uncheck();
  await expect(next).toBeEnabled();
  await paper.check();
  await expect(
    page.getByLabel("Frequência de Papel higiênico folha dupla"),
  ).toHaveValue("");
  await expect(next).toBeDisabled();
  await page.goto("/assinatura/entrega");
  await expect(
    page.getByRole("heading", { name: "Escolha a frequência dos produtos" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar aos produtos" }).click();
  await page
    .getByLabel("Frequência de Papel higiênico folha dupla")
    .selectOption("Todo mês");
  await next.click();
  await expect(page).toHaveURL("/assinatura/entrega");
});
