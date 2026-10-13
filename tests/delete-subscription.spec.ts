import { test, expect } from "./fixtures";

test("lixeira confirma exclusao, preserva outras assinaturas e persiste", async ({
  page,
}, testInfo) => {
  await page.goto("/minhas-assinaturas");
  const cards = page.locator(".subscription-card");
  await expect(cards).toHaveCount(3);
  const trash = page.getByRole("button", {
    name: "Excluir assinatura #00124",
    exact: true,
  });
  const buttonBounds = await trash.boundingBox();
  const cardBounds = await cards.first().boundingBox();
  expect(buttonBounds!.x + buttonBounds!.width).toBeGreaterThan(
    cardBounds!.x + cardBounds!.width - 25,
  );
  expect(buttonBounds!.height).toBeGreaterThanOrEqual(44);
  await trash.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("#00124");
  await dialog.getByRole("button", { name: "Manter assinatura" }).click();
  await expect(cards).toHaveCount(3);
  await trash.click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-delete-subscription.png`,
  });
  await dialog
    .getByRole("button", { name: "Excluir assinatura", exact: true })
    .click();
  await expect(trash).toHaveCount(0);
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole("tab", { name: "Todas 2" })).toBeVisible();
  await page.reload();
  await expect(cards).toHaveCount(2);
  await page.goto("/minhas-assinaturas/00124");
  await expect(
    page.getByRole("heading", { name: "Assinatura não encontrada" }),
  ).toBeVisible();
  await page.goto("/minhas-assinaturas");
  for (const id of ["00125", "00126"]) {
    await page
      .getByRole("button", { name: `Excluir assinatura #${id}`, exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Excluir assinatura", exact: true })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Nenhuma assinatura por aqui" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nenhuma assinatura por aqui" }),
  ).toBeVisible();
});
