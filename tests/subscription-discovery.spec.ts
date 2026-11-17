import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

test("nova compra recorrente começa vazia e recomenda apenas após selecionar produtos", async ({ page }) => {
  const seed = initialState();
  seed.cart = [{ productId: "leite", quantity: 2, frequency: "Semanal" }];
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seed);
  await page.goto("/assinatura/configurar");
  await expect(page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" })).toBeVisible();
  await expect(page.locator(".subscription-product")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Compre também" })).toHaveCount(0);
  await page.goto("/minhas-assinaturas");
  await page.getByRole("link", { name: "Nova compra recorrente", exact: true }).click();
  const recommendations = page.getByRole("region", { name: "Compre também" });
  const search = page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" });
  await expect(search).toBeVisible();
  await expect(page.locator(".subscription-product")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(recommendations).toHaveCount(0);
  await search.fill("leite");
  await expect(recommendations).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Incluir Leite integral Shefa na compra recorrente" }).check();
  await expect(recommendations).toBeVisible();
  await expect(recommendations.getByRole("article")).toHaveCount(3);
  await expect(recommendations.getByRole("article", { name: "Leite integral Shefa", exact: true })).toHaveCount(0);
  await search.fill("");
  await expect(page.locator(".subscription-product")).toHaveCount(1);
  await page.getByRole("checkbox").click();
  await expect(recommendations).toHaveCount(0);
  await expect(page.locator(".subscription-product")).toHaveCount(0);
});

for (const source of ["cart", "catalog", "purchase"] as const) {
  test(`busca e compre também adicionam produtos durante configuração via ${source}`, async ({ page }, testInfo) => {
    const seed = initialState();
    seed.cart = [{ productId: "leite", quantity: 2, frequency: "Semanal" }];
    seed.draft.source = source;
    seed.draft.items = [{ ...seed.cart[0] }];
    seed.draft.frequencyPending = [];
    if (source === "purchase") {
      seed.purchase = { completedItems: [...seed.cart] };
      seed.cart = [];
    }
    const originalCart = structuredClone(seed.cart);
    await page.addInitScript((state) => {
      if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
    }, seed);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/assinatura/configurar");
    const recommendations = page.getByRole("region", { name: "Compre também" });
    await expect(recommendations.getByRole("article", { name: "Pão de forma Pullman" })).toBeVisible();
    await recommendations.getByRole("article", { name: "Pão de forma Pullman" }).getByRole("button", { name: "Eu quero!" }).click();
    const bread = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Pão de forma Pullman na compra recorrente" }) });
    await expect(bread).toBeVisible();
    await expect(bread.getByRole("checkbox")).toBeChecked();
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
    await page.reload();
    await expect(bread.getByRole("checkbox")).toBeChecked();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart).toEqual(originalCart);
    expect(saved.draft.items.find((item: { productId: string }) => item.productId === "leite").quantity).toBe(2);
    expect(saved.draft.items.find((item: { productId: string }) => item.productId === "feijao").quantity).toBe(2);
    await expect(recommendations.getByRole("article", { name: "Pão de forma Pullman" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-discovery-${source}.png`, fullPage: true });
    await bread.getByRole("button", { name: "Remover Pão de forma Pullman da lista" }).click();
    await expect(bread).toHaveCount(0);
    await page.reload();
    await expect(search).toBeVisible();
    await expect(bread).toHaveCount(0);
    const afterRemoval = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(afterRemoval.cart).toEqual(originalCart);
    expect(afterRemoval.draft.items.some((item: { productId: string }) => item.productId === "pao")).toBe(false);
    await search.fill("pao");
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await expect(bread.getByRole("checkbox")).toBeChecked();

    await page.getByRole("combobox", { name: /Frequência para todos/ }).selectOption("Semanal");
    await page.getByRole("button", { name: "Aplicar frequência a todos", exact: true }).click();
    await page.getByRole("button", { name: "Continuar para entrega" }).click();
    await expect(page).toHaveURL("/assinatura/entrega");
    expect(errors).toEqual([]);
  });
}
