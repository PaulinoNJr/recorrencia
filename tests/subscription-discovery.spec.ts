import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

for (const source of ["cart", "catalog", "purchase"] as const) {
  test(`busca e compre também adicionam produtos durante configuração via ${source}`, async ({ page }, testInfo) => {
    const seed = initialState();
    seed.cart = [{ productId: "leite", quantity: 2, frequency: "Toda semana" }];
    seed.draft.source = source;
    seed.draft.items = [{ ...seed.cart[0] }];
    seed.draft.frequencyPending = [];
    if (source === "purchase") {
      seed.purchase = { completedItems: [...seed.cart] };
      seed.cart = [];
    }
    await page.addInitScript((state) => {
      if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
    }, seed);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/assinatura/configurar");
    const recommendations = page.getByRole("region", { name: "Compre também" });
    await expect(recommendations.getByRole("article", { name: "Pão de forma Pullman" })).toBeVisible();
    await recommendations.getByRole("article", { name: "Pão de forma Pullman" }).getByRole("button", { name: "Eu quero!" }).click();
    const bread = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Pão de forma Pullman na assinatura" }) });
    await expect(bread).toBeVisible();
    await expect(bread.getByRole("checkbox")).not.toBeChecked();
    const search = page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" });
    await search.fill("FEIJAO");
    const results = page.locator("#subscription-search-results");
    await expect(results.getByRole("article")).toHaveCount(1);
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await results.getByRole("button", { name: "Aumentar quantidade de Feijão carioca Broto Legal" }).click();
    await search.fill("inexistente");
    await expect(results.getByRole("heading", { name: "Nenhum produto encontrado" })).toBeVisible();
    await results.getByRole("button", { name: "Ver todos os produtos" }).click();
    await bread.getByRole("checkbox").check();
    await bread.getByRole("button", { name: "Aumentar quantidade", exact: true }).click();
    await bread.getByRole("combobox").selectOption("Toda semana");
    await page.reload();
    await expect(bread.getByRole("checkbox")).toBeChecked();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart.filter((item: { productId: string }) => item.productId === "feijao")).toEqual([{ productId: "feijao", quantity: 2, frequency: "Todo mês" }]);
    expect(saved.draft.items.find((item: { productId: string }) => item.productId === "leite").quantity).toBe(2);
    expect(saved.draft.items.some((item: { productId: string }) => item.productId === "feijao")).toBe(false);
    await expect(recommendations.getByRole("article", { name: "Pão de forma Pullman" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-discovery-${source}.png`, fullPage: true });
    await bread.getByRole("button", { name: "Remover Pão de forma Pullman da lista" }).click();
    await expect(bread).toHaveCount(0);
    await page.reload();
    await expect(search).toBeVisible();
    await expect(bread).toHaveCount(0);
    const afterRemoval = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(afterRemoval.cart.some((item: { productId: string }) => item.productId === "pao")).toBe(false);
    expect(afterRemoval.draft.items.some((item: { productId: string }) => item.productId === "pao")).toBe(false);
    await search.fill("pao");
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await expect(bread.getByRole("checkbox")).not.toBeChecked();
    await page.getByRole("button", { name: "Continuar para entrega" }).click();
    await expect(page).toHaveURL("/assinatura/entrega");
    expect(errors).toEqual([]);
  });
}
