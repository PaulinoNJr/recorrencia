import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

async function selectProducts(page: Page, mixed = true) {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  for (const [name, frequency] of [
    ["Leite integral Shefa", "Toda semana"],
    ["Café torrado e moído", mixed ? "Todo mês" : "Toda semana"],
  ]) {
    await page
      .getByRole("checkbox", { name: `Incluir ${name} na assinatura` })
      .check();
    await page.getByLabel(`Frequência de ${name}`).selectOption(frequency);
  }
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
}

test("frequencias distintas possuem entregas independentes na revisao e na assinatura", async ({
  page,
}, testInfo) => {
  await selectProducts(page);
  const weekly = page.getByRole("group", {
    name: "Entrega · Toda semana",
    exact: true,
  });
  const monthly = page.getByRole("group", {
    name: "Entrega · Todo mês",
    exact: true,
  });
  const min = (await weekly
    .getByLabel("Data de entrega · Toda semana")
    .getAttribute("min"))!;
  const max = (await monthly
    .getByLabel("Data de entrega · Todo mês")
    .getAttribute("max"))!;
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
  await expect(reviewWeekly).toContainText("Leite integral Shefa (4)");
  await expect(reviewMonthly).toContainText("Café torrado e moído (2)");
  await expect(reviewWeekly).toContainText("R$ 31,86");
  await expect(reviewMonthly).toContainText("R$ 65,70");
  await expect(page.locator(".summary-total")).toContainText("R$ 97,56");
  await page.getByRole("checkbox").check();
  await reviewWeekly
    .getByRole("button", { name: "Editar ciclo · Toda semana" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Data de entrega").fill("2099-01-01");
  await expect(
    dialog.getByRole("button", { name: "Salvar ciclo" }),
  ).toBeDisabled();
  const middle = new Date(min + "T12:00:00Z");
  middle.setUTCDate(middle.getUTCDate() + 1);
  const middleDate = middle.toISOString().slice(0, 10);
  await dialog.getByLabel("Data de entrega").fill(middleDate);
  await dialog.getByRole("button", { name: /Noite/ }).click();
  await dialog.getByRole("button", { name: "Salvar ciclo" }).click();
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
  const sub = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    return state.subscriptions.find(
      (s: { id: string }) => s.id === state.lastCreated,
    );
  });
  expect(sub.cycleDeliveries["Toda semana"]).toEqual({
    date: middleDate,
    period: "18h às 21h",
  });
  expect(sub.cycleDeliveries["Todo mês"]).toEqual({
    date: max,
    period: "12h às 18h",
  });
  expect(sub.date).toBe(middleDate);
  await page.getByRole("link", { name: "Ver minha assinatura" }).click();
  await expect(page.locator(".saved-cycle-list")).toContainText("Toda semana");
  await expect(page.locator(".saved-cycle-list")).toContainText("Todo mês");
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
