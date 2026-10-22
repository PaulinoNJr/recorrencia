import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

async function selectProducts(page: Page, mixed = true) {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  for (const name of [
    "Leite integral Shefa",
    "Café torrado e moído",
  ]) {
    await page
      .getByRole("checkbox", { name: `Incluir ${name} na assinatura` })
      .check();
    const row = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: `Incluir ${name} na assinatura` }) });
    for (let count = 0; count < (name === "Leite integral Shefa" ? 4 : 2); count++)
      await row.getByRole("button", { name: "Aumentar quantidade" }).click();
  }
  await page.getByRole("button", { name: "Continuar para frequência" }).click();
  await page.getByLabel("Frequência de Leite integral Shefa").selectOption("Toda semana");
  await page.getByLabel("Frequência de Café torrado e moído").selectOption(mixed ? "Todo mês" : "Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
}

test("frequencias distintas possuem entregas independentes na revisao e na assinatura", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-13T15:00:00Z") });
  await selectProducts(page);
  const weekly = page.getByRole("group", {
    name: "Entrega · Toda semana",
    exact: true,
  });
  const monthly = page.getByRole("group", {
    name: "Entrega · Todo mês",
    exact: true,
  });
  await expect(weekly.getByLabel("Data de entrega · Toda semana")).toHaveValue("2026-10-20");
  await expect(monthly.getByLabel("Data de entrega · Todo mês")).toHaveValue("2026-11-13");
  const min = (await weekly
    .getByLabel("Data de entrega · Toda semana")
    .getAttribute("min"))!;
  const future = new Date(min + "T12:00:00Z");
  future.setUTCDate(future.getUTCDate() + 30);
  const max = future.toISOString().slice(0, 10);
  await weekly.getByLabel("Data de entrega · Toda semana").fill(min);
  await monthly.getByLabel("Data de entrega · Todo mês").fill(max);
  await monthly.getByRole("button", { name: /Tarde/ }).click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  const cards = page.locator(".review-cycle");
  await expect(cards).toHaveCount(2);
  const reviewWeekly = page.getByRole("region", {
    name: "Ciclo · Toda semana",
    exact: true,
  });
  const reviewMonthly = page.getByRole("region", {
    name: "Ciclo · Todo mês",
    exact: true,
  });
  await expect(reviewWeekly).toContainText("Leite integral Shefa");
  await expect(reviewWeekly).toContainText("4 unidades");
  await expect(reviewMonthly).toContainText("Café torrado e moído");
  await expect(reviewMonthly).toContainText("2 unidades");
  await expect(reviewWeekly).toContainText("R$ 31,86");
  await expect(reviewMonthly).toContainText("R$ 65,70");
  await expect(page.locator(".summary-total")).toContainText("Valor estimado do próximo ciclo");
  await expect(page.locator(".summary-total")).toContainText("R$ 31,86");
  await page.getByRole("checkbox").check();
  await reviewWeekly
    .getByRole("button", { name: "Editar ciclo · Toda semana" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Data de entrega").fill("2099-01-01");
  await dialog.getByRole("button", { name: "Salvar ciclo" }).click();
  await expect(page.locator(".summary-total")).toContainText("R$ 65,70");
  await reviewWeekly.getByRole("button", { name: "Editar ciclo · Toda semana" }).click();
  await dialog.getByLabel("Data de entrega").fill("2000-01-01");
  await expect(
    dialog.getByRole("button", { name: "Salvar ciclo" }),
  ).toBeDisabled();
  const middle = new Date(min + "T12:00:00Z");
  middle.setUTCDate(middle.getUTCDate() + 1);
  const middleDate = middle.toISOString().slice(0, 10);
  await dialog.getByLabel("Data de entrega").fill(middleDate);
  await dialog.getByRole("button", { name: /Noite/ }).click();
  await dialog.getByRole("button", { name: "Salvar ciclo" }).click();
  await expect(page.locator(".summary-total")).toContainText("R$ 31,86");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(reviewWeekly).toContainText("18h às 21h");
  await expect(reviewMonthly).toContainText("12h às 18h");
  await page.reload();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-independent-cycles.png`,
    fullPage: true,
  });
  await expect(reviewWeekly).toContainText("18h às 21h");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  const created = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    return state.subscriptions.filter(
      (s: { originId: string }) => s.originId === state.lastCreated,
    );
  });
  expect(created).toHaveLength(2);
  const sub = created.find((subscription: { items: { productId: string }[] }) => subscription.items.some((item) => item.productId === "leite"));
  const monthlySub = created.find((subscription: { items: { productId: string }[] }) => subscription.items.some((item) => item.productId === "cafe"));
  expect(sub.id).not.toBe(monthlySub.id);
  expect(sub.cycleDeliveries["Toda semana"]).toEqual({
    date: middleDate,
    period: "18h às 21h",
  });
  expect(monthlySub.cycleDeliveries["Todo mês"]).toEqual({
    date: max,
    period: "12h às 18h",
  });
  expect(sub.date).toBe(middleDate);
  const successWeekly = page.getByRole("region", { name: "Resumo do ciclo · Toda semana" });
  const successMonthly = page.getByRole("region", { name: "Resumo do ciclo · Todo mês" });
  await expect(successWeekly).toContainText("Leite integral Shefa");
  await expect(successWeekly).toContainText("4 unidades");
  await expect(successWeekly.locator(".summary-total")).toContainText("R$ 31,86");
  await expect(successMonthly).toContainText("Café torrado e moído");
  await expect(successMonthly).toContainText("2 unidades");
  await expect(successMonthly.locator(".summary-total")).toContainText("R$ 65,70");
  await page.screenshot({ path: `test-results/${testInfo.project.name}-success-cycles.png`, fullPage: true });
  await successWeekly.getByRole("link", { name: "Ver detalhes desta assinatura" }).click();
  await expect(page).toHaveURL(`/minhas-assinaturas/${sub.id}`);
  await expect(page.locator(".detail-product")).toHaveCount(1);
  await expect(page.locator(".detail-product")).toContainText("Leite integral Shefa");
  await expect(page.locator(".detail-product")).not.toContainText("Café torrado e moído");
  await page.goto("/minhas-assinaturas");
  const weeklyCard = page.getByRole("article", { name: `Assinatura #${sub.id} · Toda semana` });
  const monthlyCard = page.getByRole("article", { name: `Assinatura #${monthlySub.id} · Todo mês` });
  await expect(weeklyCard).toContainText("Leite integral Shefa");
  await expect(weeklyCard).not.toContainText("Café torrado e moído");
  await expect(weeklyCard.locator(".card-stats")).toContainText("R$ 31,86");
  await expect(monthlyCard).toContainText("Café torrado e moído");
  await expect(monthlyCard).not.toContainText("Leite integral Shefa");
  await expect(monthlyCard.locator(".card-stats")).toContainText("R$ 65,70");
  await page.screenshot({ path: `test-results/${testInfo.project.name}-separate-subscriptions.png`, fullPage: true });
  await weeklyCard.getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByRole("button", { name: "Cancelar assinatura", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await page.goto("/minhas-assinaturas");
  await expect(weeklyCard).toContainText("Cancelada");
  await expect(monthlyCard).toContainText("Ativa");
  await page.reload();
  await expect(weeklyCard).toContainText("Cancelada");
  await expect(monthlyCard).toContainText("Ativa");
});

test("produtos com a mesma frequencia compartilham um unico ciclo", async ({
  page,
}) => {
  await selectProducts(page, false);
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  await expect(page.locator(".review-cycle")).toHaveCount(1);
  await expect(page.locator(".summary-total")).toContainText("R$ 87,66");
});
