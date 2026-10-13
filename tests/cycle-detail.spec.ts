import { test, expect } from "./fixtures";

test("detalhes e edicao mostram somente os produtos do ciclo selecionado", async ({ page }) => {
  await page.goto("/minhas-assinaturas");
  const monthly = page.getByRole("article").filter({ hasText: "Essenciais de casa" }).filter({ hasText: "Todo mês" });
  await monthly.getByRole("link", { name: "Ver detalhes" }).click();
  await expect(page).toHaveURL(/minhas-assinaturas\/\d+$/);
  await expect(page.locator(".detail-product")).toHaveCount(1);
  await expect(page.locator(".detail-product")).toContainText("Café torrado e moído");
  await expect(page.locator(".detail-overview")).toContainText("R$ 65,70");
  await page.reload();
  await expect(page.locator(".detail-product")).toHaveCount(1);
  await page.getByRole("link", { name: "Editar produtos", exact: true }).first().click();
  await expect(page.locator(".subscription-product")).toHaveCount(1);
  await expect(page.locator(".subscription-product")).toContainText("Café torrado e moído");
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.locator(".detail-product")).toContainText("3 unidades");
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).subscriptions.filter((subscription: { originId: string }) => subscription.originId === "00124").flatMap((subscription: { items: unknown[] }) => subscription.items));
  expect(items).toEqual(expect.arrayContaining([
    expect.objectContaining({ productId: "leite", quantity: 4 }),
    expect.objectContaining({ productId: "papel", quantity: 1 }),
    expect.objectContaining({ productId: "cafe", quantity: 3 }),
  ]));
  await page.goto("/minhas-assinaturas/00124");
  await expect(page.locator(".detail-product")).toHaveCount(1);
  await expect(page.locator(".detail-product")).toContainText("Leite integral Shefa");
});
