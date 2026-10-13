import { test, expect } from "@playwright/test";

test("sessão antiga mantém nome e CPF fixos no checkout e na nota", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("paulino@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/loja");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.customer.firstName = "Nome antigo";
    state.customer.cpf = "00000000000";
    state.purchase.firstName = "Nome antigo";
    state.purchase.cpf = "00000000000";
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).customer.firstName)).toBe("Paulino");
  await page.locator(".home-product").first().getByRole("button", { name: "Eu quero!", exact: true }).click();
  await page.goto("/carrinho");
  await page.getByRole("radio", { name: "Sim", exact: true }).check();
  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue("123.456.789-99");
  await expect(page.getByLabel("CPF", { exact: true })).toHaveAttribute("readonly", "");
  await page.goto("/checkout/dados");
  await expect(page).toHaveURL("/checkout/entrega");
  await expect(page.getByLabel("Nome", { exact: true })).toHaveCount(0);
  await expect(page.locator(".checkout-saved-info").first()).toContainText("Paulino");
  await page.goto("/checkout");
  await expect(page).toHaveURL("/checkout/entrega");
  await page.goto("/identificacao?next=/assinatura/entrega");
  await expect(page).toHaveURL("/assinatura/entrega");
  await expect(page.getByRole("heading", { name: "Identifique-se para continuar" })).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.customer.email).toBe("paulino@example.com");
  expect(saved.customer.cpf).toBe("123.456.789-99");
  expect(saved.purchase.firstName).toBe("Paulino");
  expect(saved.purchase.cpf).toBe("123.456.789-99");
});
