import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";
import type { Frequency } from "../types";
import { dateLabel } from "../lib/utils";

const cases: { frequency: Frequency; date: string }[] = [
  { frequency: "Semanal", date: "2026-11-24" },
  { frequency: "Quinzenal", date: "2026-12-01" },
  { frequency: "Mensal", date: "2026-12-17" },
];

for (const scenario of cases) {
  test("reativacao " + scenario.frequency + " calcula a proxima entrega para pausadas e canceladas", async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date("2026-11-17T15:00:00Z") });
    const seed = initialState();
    const items = [{ productId: "leite", quantity: 2, frequency: scenario.frequency }];
    seed.subscriptions = [
      { ...seed.subscriptions[0], status: "Pausada", items, date: "2030-01-01", period: "12h às 18h", pausedUntil: "2030-01-01", cycleDeliveries: { [scenario.frequency]: { date: "2030-01-01", period: "12h às 18h" } } },
      { ...seed.subscriptions[1], status: "Cancelada", items, date: "2026-01-01", period: "12h às 18h", cycleDeliveries: { [scenario.frequency]: { date: "2026-01-01", period: "12h às 18h" } } },
    ];
    await page.addInitScript((state) => {
      if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
    }, seed);
    await page.goto("/minhas-assinaturas/00124");
    await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reativar compra recorrente", exact: true }).click();
    await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    expect(saved.subscriptions[0]).toMatchObject({ status: "Ativa", date: scenario.date, period: "12h às 18h", items });
    expect(saved.subscriptions[0].cycleDeliveries[scenario.frequency].date).toBe(scenario.date);
    expect(saved.subscriptions[0].pausedUntil).toBeUndefined();
    expect(saved.subscriptions[0].history).toEqual(seed.subscriptions[0].history);
    await page.goto("/minhas-assinaturas/00125");
    await page.getByRole("button", { name: "Reativar compra recorrente", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Data de entrega", { exact: true })).toHaveValue(scenario.date);
    await expect(dialog.getByRole("button", { name: /Tarde/ })).toHaveClass(/chosen/);
    await expect(dialog).toContainText("conforme a frequência já selecionada");
    if (scenario.frequency === "Semanal") await page.screenshot({ path: "test-results/" + testInfo.project.name + "-reactivation-frequency.png" });
    await dialog.getByRole("button", { name: "Confirmar reativação" }).click();
    await page.reload();
    await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
    for (const sub of saved.subscriptions) {
      expect(sub).toMatchObject({ status: "Ativa", date: scenario.date, period: "12h às 18h", items });
      expect(sub.cycleDeliveries[scenario.frequency]).toEqual({ date: scenario.date, period: "12h às 18h" });
    }
    expect(saved.subscriptions[1].history).toEqual(seed.subscriptions[1].history);
    expect(saved.cart).toEqual(seed.cart);
    await page.goto("/minhas-assinaturas/financeiro");
    const month = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(scenario.date + "T12:00:00Z"));
    const label = month.charAt(0).toUpperCase() + month.slice(1);
    await page.getByRole("button", { name: "Ver " + label + " de " + scenario.date.slice(0, 4), exact: true }).click();
    await expect(page.locator(".finance-charge").first()).toContainText(dateLabel(scenario.date));
  });
}
