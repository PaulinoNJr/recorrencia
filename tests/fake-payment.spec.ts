import { test, expect } from "@playwright/test";

test("cartão fictício já selecionado permite compra e recorrência sem adicionar cartão", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await page.locator(".home-product").first().getByRole("button", { name: "Eu quero!", exact: true }).click();
  await page.goto("/carrinho");
  await page.getByRole("radio", { name: "Reembolso do valor", exact: true }).check();
  await page.getByRole("radio", { name: "Não", exact: true }).check();
  await page.getByRole("button", { name: "Finalizar pedido", exact: true }).click();
  await expect(page).toHaveURL("/checkout");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/checkout/entrega");
  await page.getByRole("button", { name: "Ir para pagamento", exact: true }).click();
  await expect(page).toHaveURL("/checkout/pagamento");
  await expect(page.locator(".choice-grid .chosen")).toContainText("Mastercard");
  await expect(page.locator(".choice-grid .chosen")).toContainText("1234");
  await expect(page.getByRole("button", { name: "Confirmar compra", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await page.getByRole("button", { name: "Sim, tornar recorrente" }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  await page.getByRole("button", { name: "Continuar para frequência" }).click();
  await page.getByLabel("Frequência de Leite integral Shefa").selectOption("Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await expect(page).toHaveURL("/assinatura/pagamento");
  await expect(page.locator(".choice-grid .chosen")).toContainText("Mastercard");
  await expect(page.getByRole("button", { name: "Revisar assinatura" })).toBeEnabled();
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(page.getByRole("heading", { name: "Sua assinatura foi criada!" })).toBeVisible();
});

test("cartão retorna em sessões antigas e permanece após saída e reinício", async ({ page }, testInfo) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/loja");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.payments = [];
    state.draft.paymentId = "";
    state.purchase.paymentId = "";
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.reload();
  const check = async () => {
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).payments[0]?.id)).toBe("master");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.payments[0].last4).toBe("1234");
    expect(saved.draft.paymentId).toBe("master");
  };
  await check();
  await page.getByRole("button", { name: "Menu da conta" }).click();
  const menu = page.locator(testInfo.project.name === "mobile" ? "#mobile-store-menu" : "#account-dropdown");
  await menu.getByRole("button", { name: "Sair", exact: true }).click();
  await check();
  await page.goto("/home");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await check();
});
