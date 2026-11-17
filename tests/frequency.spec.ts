import { test, expect } from "./fixtures";

test("frequência pendente é obrigatória e remover o item libera continuar", async ({ page }) => {
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Criar compra recorrente", exact: true }).click();
  for (const name of ["Leite integral Shefa", "Papel higiênico folha dupla"]) {
    const row = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: `Incluir ${name} na compra recorrente` }) });
    await row.getByRole("checkbox").check();
    await row.getByRole("button", { name: "Aumentar quantidade" }).click();
  }

  const next = page.getByRole("button", { name: "Continuar para entrega" });
  await expect(next).toBeDisabled();
  await page.getByLabel("Frequência de Leite integral Shefa").selectOption("Semanal");
  await expect(next).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("Frequência de Papel higiênico folha dupla")).toHaveValue("");
  await page.getByRole("button", { name: "Remover Papel higiênico folha dupla da lista" }).click();

  await expect(next).toBeEnabled();
  await next.click();
  await expect(page).toHaveURL("/assinatura/entrega");
});
