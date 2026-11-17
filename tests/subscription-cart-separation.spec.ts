import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

for (const source of ["cart", "catalog"] as const) {
  test(`compra recorrente via ${source} mantém produtos e quantidades separados do carrinho`, async ({ page }, testInfo) => {
    const seed = initialState();
    seed.cart = [
      { productId: "leite", quantity: 3, frequency: "Semanal" },
      { productId: "cafe", quantity: 1, frequency: "Mensal" },
    ];
    await page.addInitScript((state) => {
      if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
    }, seed);
    if (source === "cart") {
      await page.goto("/carrinho");
      await page.getByRole("button", { name: "Criar compra recorrente", exact: true }).click();
      await expect(page.locator(".subscription-product")).toHaveCount(2);
    } else {
      await page.goto("/minhas-assinaturas");
      await page.getByRole("link", { name: "Nova compra recorrente", exact: true }).click();
      await expect(page.locator(".subscription-product")).toHaveCount(0);
    }
    const today = page.getByRole("region", { name: "Sua compra de hoje", exact: true });
    await expect(today).toBeVisible();
    await expect(page.locator(".summary").getByRole("heading", { name: "Sua próxima recorrência", exact: true })).toBeVisible();
    await today.locator("summary").click();
    await expect(today).toContainText("3 unidades");
    await expect(today).toContainText("R$ 44,37");
    const originalPurchase = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).purchase);
    const search = page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" });
    await search.fill("leite");
    const results = page.locator("#subscription-search-results");
    // The cart has 3 units; this selection starts independently at 1.
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await expect(results.locator("output")).toHaveText("1");
    await results.getByRole("button", { name: "Aumentar quantidade de Leite integral Shefa" }).click();
    const milk = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Leite integral Shefa na compra recorrente" }) });
    await expect(milk.locator("output")).toHaveText("2");
    await milk.getByRole("combobox").selectOption("Mensal");
    await page.getByRole("combobox", { name: /Frequência para todos/ }).selectOption("Quinzenal");
    await page.getByRole("button", { name: "Aplicar frequência a todos" }).click();
    await page.getByRole("radio", { name: "Substituir por produto similar de valor igual ou inferior" }).check();
    await page.getByRole("radio", { name: "Sim", exact: true }).check();
    await expect(today).toContainText("3 unidades");
    await expect(today).toContainText("R$ 44,37");
    await page.screenshot({ path: `test-results/${testInfo.project.name}-separate-purchases-${source}.png`, fullPage: true });
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart).toEqual(seed.cart);
    expect(saved.purchase).toEqual(originalPurchase);
    expect(saved.draft.items.find((item: { productId: string }) => item.productId === "leite").quantity).toBe(2);
    await milk.getByRole("button", { name: "Remover Leite integral Shefa da lista" }).click();
    await expect(milk).toHaveCount(0);
    await search.fill("feijao");
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await results.getByRole("button", { name: "Aumentar quantidade de Feijão carioca Broto Legal" }).click();
    await page.reload();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart).toEqual(seed.cart);
    expect(saved.draft.items.map((item: { productId: string }) => item.productId)).toEqual(["feijao"]);
    expect(saved.draft.items[0].quantity).toBe(2);
    expect(saved.purchase).toEqual(originalPurchase);
    await today.locator("summary").click();
    await expect(today).toContainText("3 unidades");
    await expect(today).not.toContainText("Feijão");
    await search.fill("feijao");
    const decrease = results.getByRole("button", { name: "Diminuir quantidade de Feijão carioca Broto Legal" });
    await decrease.click();
    await decrease.click();
    await expect(page.getByRole("region", { name: "Compre também" })).toHaveCount(0);
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.draft.items).toEqual([]);
    expect(saved.cart).toEqual(seed.cart);
    const draftBeforeCart = saved.draft;
    await page.goto("/carrinho");
    const cartMilk = page.locator(".cart-item").filter({ has: page.getByRole("heading", { name: "Leite integral Shefa", exact: true }) });
    await expect(cartMilk.locator("output")).toHaveText("3");
    await cartMilk.getByRole("button", { name: "Aumentar quantidade", exact: true }).click();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart[0].quantity).toBe(4);
    expect(saved.draft).toEqual(draftBeforeCart);
  });
}

test("entrega da compra de hoje usa data e horario independentes da recorrencia", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-13T15:00:00Z") });
  const seed = initialState();
  seed.draft.date = "2099-01-01";
  seed.draft.period = "18h às 21h";
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seed);
  await page.goto("/checkout/entrega");
  await expect(page.getByLabel("Data de entrega", { exact: true })).toHaveValue("2026-10-14");
  await expect(page.getByRole("button", { name: /Manhã/ })).toHaveClass(/chosen/);
  await page.getByLabel("Data de entrega", { exact: true }).fill("2026-10-15");
  await page.getByRole("button", { name: /Tarde/ }).click();
  await page.goto("/assinatura/configurar");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.draft.date = "2099-02-01";
    state.draft.period = "08h às 12h";
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.goto("/checkout/entrega");
  await expect(page.getByLabel("Data de entrega", { exact: true })).toHaveValue("2026-10-15");
  await expect(page.getByRole("button", { name: /Tarde/ })).toHaveClass(/chosen/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.cart).toEqual(seed.cart);
});
