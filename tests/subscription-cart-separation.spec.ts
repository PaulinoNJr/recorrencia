import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

for (const source of ["cart", "catalog"] as const) {
  test(`compra recorrente via ${source} mantém produtos e quantidades separados do carrinho`, async ({ page }) => {
    const seed = initialState();
    seed.cart = [
      { productId: "leite", quantity: 3, frequency: "Toda semana" },
      { productId: "cafe", quantity: 1, frequency: "Todo mês" },
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
    const search = page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" });
    await search.fill("leite");
    const results = page.locator("#subscription-search-results");
    // The cart has 3 units; this selection starts independently at 1.
    await results.getByRole("button", { name: "Eu quero!" }).click();
    await expect(results.locator("output")).toHaveText("1");
    await results.getByRole("button", { name: "Aumentar quantidade de Leite integral Shefa" }).click();
    const milk = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Leite integral Shefa na compra recorrente" }) });
    await expect(milk.locator("output")).toHaveText("2");
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.cart).toEqual(seed.cart);
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
