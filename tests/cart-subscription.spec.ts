import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";
import { products } from "../data/products";

test("todos os produtos do carrinho podem ser configurados para recorrencia", async ({ page }) => {
  const state = initialState();
  state.cart = products.filter((product) => product.id !== "substituto").map((product) => ({
    productId: product.id,
    quantity: product.id === "abacaxi" ? 4 : 1,
    frequency: product.frequency,
  }));
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("covabra-prototype-v1")) {
      localStorage.setItem("covabra-prototype-v1", JSON.stringify(seed));
    }
  }, state);
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Criar assinatura", exact: true }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  await expect(page.locator(".subscription-product")).toHaveCount(state.cart.length);
  for (const product of products.filter((product) => product.id !== "substituto")) {
    await expect(page.getByRole("checkbox", { name: `Incluir ${product.name} na assinatura` })).toBeEnabled();
  }
  const next = page.getByRole("button", { name: "Continuar para entrega" });
  for (const name of ["Óleo de soja Soya", "Abacaxi pérola"]) {
    const checkbox = page.getByRole("checkbox", { name: `Incluir ${name} na assinatura` });
    await checkbox.check();
    await page.getByLabel(`Frequência de ${name}`).selectOption("Toda semana");
    await expect(next).toBeDisabled();
    const row = page.locator(".subscription-product").filter({ has: checkbox });
    await row.getByRole("button", { name: "Aumentar quantidade" }).click();
  }
  await expect(next).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Incluir Abacaxi pérola na assinatura" })).toBeChecked();
  await next.click();
  await expect(page).toHaveURL("/assinatura/entrega");
  await expect(page.getByRole("list", { name: "Produtos · Toda semana" })).toContainText("Óleo de soja Soya");
  await expect(page.getByRole("list", { name: "Produtos · Toda semana" })).toContainText("Abacaxi pérola");
});
