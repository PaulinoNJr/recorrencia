import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";

function seedState() {
  const seed = initialState();
  seed.subscriptions = seed.subscriptions.slice(0, 2).map((sub) => ({ ...sub, items: [sub.items[0]], cycleDeliveries: undefined }));
  return seed;
}

test("ativa, pausada e cancelada preservam dados e permitem reativacao com nova entrega", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-17T15:00:00Z") });
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seedState());
  await page.goto("/minhas-assinaturas/00124");
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  const original = before.subscriptions.find((sub: { id: string }) => sub.id === "00124");
  await page.getByRole("button", { name: "Pausar compra recorrente", exact: true }).click();
  await page.getByRole("button", { name: "15 dias", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar pausa" }).click();
  await page.reload();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reativar compra recorrente", exact: true }).click();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar compra recorrente", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("reativar quando quiser");
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await page.reload();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await expect(page.getByText("Sem entregas agendadas", { exact: true })).toBeVisible();
  await page.goto("/minhas-assinaturas");
  await page.getByRole("tab", { name: /Canceladas/ }).click();
  const card = page.getByRole("article", { name: /Compra recorrente #00124/ });
  await expect(card).toContainText("Sem entregas");
  await card.getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByRole("button", { name: "Reativar compra recorrente" }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Confirmar reativação" });
  await expect(dialog.getByLabel("Data de entrega", { exact: true })).toHaveValue("2026-11-24");
  await dialog.getByLabel("Data de entrega", { exact: true }).fill("2000-01-01");
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("button", { name: "Manter cancelada" }).click();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reativar compra recorrente" }).click();
  await dialog.getByLabel("Data de entrega", { exact: true }).fill("2026-11-20");
  await dialog.getByRole("button", { name: /Tarde/ }).click();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-reactivate-canceled.png` });
  await confirm.click();
  await page.reload();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  const active = saved.subscriptions.find((sub: { id: string }) => sub.id === "00124");
  expect(active).toMatchObject({ status: "Ativa", date: "2026-11-20", period: "12h às 18h" });
  expect(active.pausedUntil).toBeUndefined();
  expect(active.items).toEqual(original.items);
  expect(active.history).toEqual(original.history);
  expect(active.events.join(" ")).toContain("cancelada");
  expect(active.events.join(" ")).toContain("reativada");
  expect(saved.cart).toEqual(before.cart);
  expect(saved.subscriptions.find((sub: { id: string }) => sub.id === "00125")).toEqual(before.subscriptions.find((sub: { id: string }) => sub.id === "00125"));
});

test("falha de pagamento e um aviso e corrigir cartao nao muda o estado de pausa", async ({ page }) => {
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) {
      const legacy = { ...state, subscriptions: state.subscriptions.map((sub) => sub.id === "00124" ? { ...sub, status: "Pagamento recusado", paymentStatus: undefined } : { ...sub, paymentStatus: "Recusado" }) };
      localStorage.setItem("covabra-prototype-v1", JSON.stringify(legacy));
    }
  }, seedState());
  await page.goto("/minhas-assinaturas");
  await page.getByRole("tab", { name: /Ativas/ }).click();
  const card = page.getByRole("article", { name: /Compra recorrente #00124/ });
  await expect(card.getByText("Ativa", { exact: true })).toBeVisible();
  await expect(card).toContainText("Atualize o cartão");
  await card.getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByRole("button", { name: "Atualizar cartão" }).click();
  await page.getByRole("button", { name: "Salvar pagamento" }).click();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.subscriptions.find((sub: { id: string }) => sub.id === "00124").paymentStatus).toBeUndefined();
  await page.goto("/minhas-assinaturas/00125");
  await page.getByRole("button", { name: "Atualizar cartão" }).click();
  await page.getByRole("button", { name: "Salvar pagamento" }).click();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.subscriptions.find((sub: { id: string }) => sub.id === "00125").paymentStatus).toBeUndefined();
  await page.reload();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
});
