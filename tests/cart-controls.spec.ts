import { test, expect } from "@playwright/test";

test("quantidade dos cards acompanha o carrinho e persiste entre telas", async ({
  page,
}) => {
  await page.goto("/comprar");
  const milk = page
    .locator(".catalog-product")
    .filter({
      has: page.getByRole("heading", {
        name: "Leite integral Shefa",
        exact: true,
      }),
    });
  await milk.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.cart = [];
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.reload();
  await milk.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(milk.locator("output")).toHaveText("1");
  await milk.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(milk.locator("output")).toHaveText("2");
  await page.reload();
  await expect(milk.locator("output")).toHaveText("2");
  await page.goto("/");
  const homeMilk = page.locator(".home-product").first();
  await expect(homeMilk.locator("output")).toHaveText("2");
  await homeMilk.getByRole("button", { name: "Diminuir quantidade" }).click();
  await expect(homeMilk.locator("output")).toHaveText("1");
  await homeMilk.getByRole("button", { name: "Diminuir quantidade" }).click();
  await expect(
    homeMilk.getByRole("button", { name: "Adicionar", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
    ),
  ).toEqual([]);
  await page.goto("/comprar");
  await expect(
    milk.getByRole("button", { name: "Adicionar", exact: true }),
  ).toBeVisible();
});

test("limite de quantidade e controles acessiveis em tela estreita", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/comprar");
  const milk = page.locator(".catalog-product").first();
  await milk.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.cart = [
      {
        ...state.cart.find(
          (item: { productId: string }) => item.productId === "leite",
        ),
        quantity: 99,
      },
    ];
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.reload();
  await expect(milk.locator("output")).toHaveText("99");
  await expect(
    milk.getByRole("button", { name: "Aumentar quantidade" }),
  ).toBeDisabled();
  await milk.getByRole("button", { name: "Diminuir quantidade" }).click();
  await expect(milk.locator("output")).toHaveText("98");
  await expect(
    milk.getByRole("button", { name: "Aumentar quantidade" }),
  ).toBeEnabled();
  for (const button of await milk
    .locator(".product-cart-quantity button")
    .all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/cart-controls-320.png",
    fullPage: true,
  });
});
