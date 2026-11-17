import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";
import { frequencies } from "../data/products";
import { FREQUENCY_DAYS } from "../lib/frequency";
import { migrateLegacyFrequency, normalizeLegacyFrequency } from "../lib/legacy-frequency";

test("projeto oferece somente Semanal Quinzenal e Mensal com intervalos consistentes", () => {
  expect(frequencies).toEqual(["Semanal", "Quinzenal", "Mensal"]);
  expect(FREQUENCY_DAYS).toEqual({ Semanal: 7, Quinzenal: 14, Mensal: 30 });
  expect(normalizeLegacyFrequency("Toda semana")).toBe("Semanal");
  expect(normalizeLegacyFrequency("A cada 2 semanas")).toBe("Quinzenal");
  expect(normalizeLegacyFrequency("Todo mês")).toBe("Mensal");
  expect(normalizeLegacyFrequency("A cada 2 meses")).toBe("Mensal");
  const restored = JSON.parse(JSON.stringify({
    name: "Família · A cada 2 meses",
    items: [{ productId: "leite", quantity: 3, frequency: "A cada 2 meses" }],
    cycleDeliveries: {
      "A cada 2 meses": { date: "2026-12-30", period: "08h às 12h" },
      Mensal: { date: "2026-12-03", period: "12h às 18h" },
    },
  }), migrateLegacyFrequency);
  expect(restored.name).toBe("Família · Mensal");
  expect(restored.items).toEqual([{ productId: "leite", quantity: 3, frequency: "Mensal" }]);
  expect(restored.cycleDeliveries).toEqual({ Mensal: { date: "2026-12-03", period: "12h às 18h" } });
});

test("sessao antiga e recuperada sem perder produtos proxima data ou historico", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-17T15:00:00Z") });
  const seed = initialState();
  const history = seed.subscriptions[0].history;
  await page.addInitScript((state) => {
    if (localStorage.getItem("covabra-prototype-v1")) return;
    const oldItem = { productId: "leite", quantity: 2, frequency: "A cada 2 meses" };
    const oldDelivery = { "A cada 2 meses": { date: "2026-12-03", period: "12h às 18h" } };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify({
      ...state,
      cart: [{ productId: "leite", quantity: 3, frequency: "Toda semana" }],
      draft: { ...state.draft, name: "Família · A cada 2 meses", source: "cart", items: [oldItem], frequencyPending: [], discoveredProductIds: ["leite"], cycleDeliveries: oldDelivery },
      subscriptions: [{ ...state.subscriptions[0], name: "Família · A cada 2 meses", items: [oldItem], date: "2026-12-03", period: "12h às 18h", cycleDeliveries: oldDelivery }],
    }));
  }, seed);
  await page.goto("/assinatura/configurar");
  const frequency = page.getByRole("combobox", { name: "Frequência de Leite integral Shefa", exact: true });
  await expect(frequency).toHaveValue("Mensal");
  expect(await frequency.locator("option:not([disabled])").allTextContents()).toEqual(["Semanal", "Quinzenal", "Mensal"]);
  expect(await page.getByRole("combobox", { name: /Frequência para todos/ }).locator("option:not([disabled])").allTextContents()).toEqual(["Semanal", "Quinzenal", "Mensal"]);
  await page.reload();
  await expect(frequency).toHaveValue("Mensal");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.cart).toEqual([{ productId: "leite", quantity: 3, frequency: "Semanal" }]);
  expect(saved.subscriptions[0]).toMatchObject({ id: "00124", name: "Família · Mensal", date: "2026-12-03", period: "12h às 18h", items: [{ productId: "leite", quantity: 2, frequency: "Mensal" }] });
  expect(saved.subscriptions[0].cycleDeliveries).toEqual({ Mensal: { date: "2026-12-03", period: "12h às 18h" } });
  expect(saved.subscriptions[0].history).toEqual(history);
  await page.goto("/minhas-assinaturas/00124/editar?ciclo=" + encodeURIComponent("A cada 2 meses"));
  await expect(frequency).toHaveValue("Mensal");
  expect(await frequency.locator("option:not([disabled])").allTextContents()).toEqual(["Semanal", "Quinzenal", "Mensal"]);
  await page.screenshot({ path: "test-results/" + testInfo.project.name + "-three-frequencies.png", fullPage: true });
  await page.goto("/minhas-assinaturas/financeiro");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00124", exact: true })).toContainText("Mensal");
  await expect(page.locator("main")).not.toContainText("A cada 2 meses");
});
