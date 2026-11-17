import { test, expect } from "./fixtures";

test("lixeira confirma exclusao, preserva outras compras recorrentes e persiste", async ({
  page,
}, testInfo) => {
  await page.goto("/minhas-assinaturas");
  const cards = page.locator(".subscription-card");
  await expect(cards).toHaveCount(7);
  const trash = page.getByRole("button", {
    name: "Excluir compra recorrente #00124",
    exact: true,
  }).first();
  const buttonBounds = await trash.boundingBox();
  const cardBounds = await cards.first().boundingBox();
  expect(buttonBounds!.x + buttonBounds!.width).toBeGreaterThan(
    cardBounds!.x + cardBounds!.width - 25,
  );
  expect(buttonBounds!.height).toBeGreaterThanOrEqual(44);
  await trash.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("#00124");
  await dialog.getByRole("button", { name: "Manter compra recorrente" }).click();
  await expect(cards).toHaveCount(7);
  await trash.click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-delete-subscription.png`,
  });
  await dialog
    .getByRole("button", { name: "Excluir compra recorrente", exact: true })
    .click();
  await expect(trash).toHaveCount(0);
  await expect(cards).toHaveCount(6);
  await expect(page.getByRole("tab", { name: "Todas 6" })).toBeVisible();
  await page.reload();
  await expect(cards).toHaveCount(6);
  await page.goto("/minhas-assinaturas/00124");
  await expect(
    page.getByRole("heading", { name: "Compra recorrente não encontrada" }),
  ).toBeVisible();
  await page.goto("/minhas-assinaturas");
  await expect(cards).toHaveCount(6);
  while (await cards.count()) {
    await page
      .getByRole("button", { name: /Excluir compra recorrente #/ })
      .first()
      .click();
    await dialog
      .getByRole("button", { name: "Excluir compra recorrente", exact: true })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Nenhuma compra recorrente por aqui" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nenhuma compra recorrente por aqui" }),
  ).toBeVisible();
});
