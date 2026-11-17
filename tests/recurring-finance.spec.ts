import { test, expect } from "@playwright/test";
import type { Subscription } from "../types";
import { initialState } from "../data/subscriptions";
import { projectRecurringCosts } from "../lib/recurring-finance";

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "00124", name: "Essenciais", status: "Ativa",
    items: [{ productId: "leite", quantity: 2, frequency: "Semanal" }],
    date: "2026-11-17", period: "08h às 12h", addressId: "casa", paymentId: "master", history: [], events: [],
    ...overrides,
  };
}

test("mes atual e seguintes agrupam entregas pelos meses do calendario", () => {
  const result = projectRecurringCosts([subscription()], "2026-11-17");
  expect(result.monthStart).toBe("2026-11-01");
  expect(result.monthEnd).toBe("2026-12-01");
  expect(result.horizonEnd).toBe("2027-02-01");
  expect(result.monthlyCount).toBe(2);
  expect(result.productsCents).toBe(2196);
  expect(result.freightCents).toBe(1980);
  expect(result.totalCents).toBe(4176);
  expect(result.charges).toHaveLength(11);
  expect(result.months.map((month) => [month.key, month.count, month.totalCents])).toEqual([["2026-11", 2, 4176], ["2026-12", 5, 10440], ["2027-01", 4, 8352]]);
  expect(result.charges.filter((charge) => charge.date < result.monthEnd).map((charge) => charge.date)).toEqual(["2026-11-17", "2026-11-24"]);
});

test("produtos do mesmo ciclo compartilham um unico frete por entrega", () => {
  const result = projectRecurringCosts([subscription({ items: [
    { productId: "leite", quantity: 2, frequency: "Semanal" },
    { productId: "feijao", quantity: 1, frequency: "Semanal" },
  ] })], "2026-11-17");
  expect(result.monthlyCount).toBe(2);
  expect(result.productsCents).toBe(3794);
  expect(result.freightCents).toBe(1980);
  expect(result.totalCents).toBe(5774);
});

test("pausadas e canceladas ficam fora e pagamento pendente e apenas um aviso", () => {
  const result = projectRecurringCosts([
    subscription({ paymentStatus: "Recusado" }),
    subscription({ id: "00125", status: "Pausada", pausedUntil: "2026-11-20" }),
    subscription({ id: "00126", status: "Cancelada" }),
  ], "2026-11-17");
  expect(result.totalCents).toBe(4176);
  expect(result.rows.map((row) => row.totalCents)).toEqual([4176, 0, 0]);
  expect(result.charges.every((charge) => charge.subscriptionId === "00124" && charge.paymentPending)).toBe(true);
});

test("intervalos quinzenal e mensal preservam a agenda e a janela exclusiva", () => {
  const result = projectRecurringCosts([
    subscription({ id: "1", items: [{ productId: "leite", quantity: 2, frequency: "Quinzenal" }] }),
    subscription({ id: "2", items: [{ productId: "leite", quantity: 2, frequency: "Mensal" }] }),
  ], "2026-11-17");
  expect(result.rows.map((row) => row.count)).toEqual([1, 1]);
  expect(result.charges).toHaveLength(9);
  expect(result.charges.filter((charge) => charge.subscriptionId === "2").map((charge) => charge.date)).toEqual(["2026-11-17", "2026-12-17", "2027-01-16"]);
});

test("datas antigas sao projetadas para frente sem modificar a recorrencia", () => {
  const subscriptions = [subscription({ date: "2026-11-03" })];
  const before = JSON.stringify(subscriptions);
  const result = projectRecurringCosts(subscriptions, "2026-11-17");
  expect(result.rows[0].nextDate).toBe("2026-11-17");
  expect(result.totalCents).toBe(8352);
  expect(result.monthlyCount).toBe(4);
  expect(result.upcomingCharges[0].date).toBe("2026-11-17");
  expect(JSON.stringify(subscriptions)).toBe(before);
});

test("pular uma entrega nao elimina todos os ciclos futuros nem gera frete vazio", () => {
  const result = projectRecurringCosts([subscription({ items: [{ productId: "leite", quantity: 2, frequency: "Semanal", skipOnce: true }] })], "2026-11-17");
  expect(result.monthlyCount).toBe(1);
  expect(result.totalCents).toBe(2088);
  expect(result.rows[0].nextDate).toBe("2026-11-24");
  expect(result.charges[0].date).toBe("2026-11-24");
});

test("meses do calendario atravessam o ano sem misturar janeiro e fevereiro", () => {
  const result = projectRecurringCosts([subscription({ date: "2026-12-31", items: [{ productId: "leite", quantity: 2, frequency: "Mensal" }] })], "2026-12-31");
  expect(result.monthEnd).toBe("2027-01-01");
  expect(result.months.map((month) => [month.key, month.count])).toEqual([["2026-12", 1], ["2027-01", 1], ["2027-02", 0]]);
  expect(result.monthlyCount).toBe(1);
  expect(result.totalCents).toBe(2088);
  expect(projectRecurringCosts([], "2026-12-31").totalCents).toBe(0);
});

test("fevereiro bissexto inclui o dia 29 e respeita os limites de cada mes", () => {
  const result = projectRecurringCosts([subscription({ date: "2028-02-01", items: [{ productId: "leite", quantity: 2, frequency: "Quinzenal" }] })], "2028-02-17");
  expect(result.months.map((month) => [month.key, month.count])).toEqual([["2028-02", 3], ["2028-03", 2], ["2028-04", 2]]);
  expect(result.charges.slice(0, 3).map((charge) => charge.date)).toEqual(["2028-02-01", "2028-02-15", "2028-02-29"]);
});

test("pular a proxima entrega preserva as datas anteriores do mes", () => {
  const result = projectRecurringCosts([subscription({ date: "2026-11-03", items: [{ productId: "leite", quantity: 2, frequency: "Semanal", skipOnce: true }] })], "2026-11-17");
  expect(result.charges.filter((charge) => charge.date < result.monthEnd).map((charge) => charge.date)).toEqual(["2026-11-03", "2026-11-10", "2026-11-24"]);
  expect(result.totalCents).toBe(6264);
  expect(result.upcomingCharges[0].date).toBe("2026-11-24");
});

test("primeira entrega futura nao cria entregas em meses anteriores", () => {
  const result = projectRecurringCosts([subscription({ date: "2027-01-10", items: [{ productId: "leite", quantity: 2, frequency: "Mensal" }] })], "2026-11-17");
  expect(result.months.map((month) => month.totalCents)).toEqual([0, 0, 2088]);
});

test("financeiro navega pela conta, detalha estimativas e preserva a compra de hoje", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-17T15:00:00Z") });
  const seed = initialState();
  seed.subscriptions = [
    subscription({ name: "Essenciais de casa" }),
    subscription({ id: "00125", status: "Pausada", name: "Despensa pausada", pausedUntil: "2026-11-25" }),
    subscription({ id: "00126", status: "Cancelada", name: "Compra cancelada" }),
  ];
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seed);
  await page.goto("/minhas-assinaturas");
  const nav = page.getByRole("navigation", { name: "Minhas compras recorrentes", exact: true });
  await expect(nav).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  await nav.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page).toHaveURL("/minhas-assinaturas/financeiro");
  await expect(page.getByRole("heading", { name: "Financeiro", exact: true })).toBeVisible();
  const november = page.getByRole("article", { name: "Estimativa de Novembro de 2026", exact: true });
  await expect(november).toContainText("R$ 41,76");
  await expect(november).toContainText("R$ 21,96");
  await expect(november).toContainText("R$ 19,80");
  await expect(page.getByRole("article", { name: "Estimativa de Dezembro de 2026", exact: true })).toContainText("R$ 104,40");
  await expect(page.getByRole("article", { name: "Estimativa de Janeiro de 2027", exact: true })).toContainText("R$ 83,52");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00125", exact: true })).toContainText("fora da projeção");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00126", exact: true })).toContainText("R$ 0,00");
  await expect(page.getByText("Preços e fretes estimados, sujeitos a variação.", { exact: true })).toBeVisible();
  await expect(page.locator(".finance-charge")).toHaveCount(2);
  await expect(page.locator(".finance-charge").first()).toContainText("17/11/2026");
  await page.getByRole("button", { name: "Ver Dezembro de 2026", exact: true }).click();
  await expect(page.locator(".finance-charge")).toHaveCount(5);
  await expect(page.locator(".finance-charge").first()).toContainText("01/12/2026");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00124", exact: true })).toContainText("R$ 104,40");
  await page.getByRole("button", { name: "Ver Janeiro de 2027", exact: true }).click();
  await expect(page.locator(".finance-charge")).toHaveCount(4);
  await expect(page.locator(".finance-charge").last()).toContainText("26/01/2027");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00124", exact: true })).toContainText("R$ 83,52");
  await page.getByRole("button", { name: "Ver Novembro de 2026", exact: true }).click();
  await page.screenshot({ path: "test-results/" + testInfo.project.name + "-financeiro.png", fullPage: true });
  for (const width of testInfo.project.name === "mobile" ? [320, 390, 768] : [1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(after.cart).toEqual(before.cart);
  expect(after.subscriptions).toEqual(before.subscriptions);
  await page.goto("/minhas-assinaturas/00124");
  await page.getByRole("button", { name: "Cancelar compra recorrente", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await page.goto("/minhas-assinaturas/financeiro");
  await expect(page.locator(".finance-month-card").first()).toContainText("R$ 0,00");
  await expect(page.getByRole("heading", { name: "Nenhuma próxima cobrança prevista em Novembro de 2026", exact: true })).toBeVisible();
});

test("financeiro exige identificacao e retorna para o painel vazio depois de entrar", async ({ page }) => {
  await page.goto("/minhas-assinaturas/financeiro");
  await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill("financeiro@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Financeiro", exact: true })).toBeVisible();
  await expect(page).toHaveURL("/minhas-assinaturas/financeiro");
  await expect(page.locator(".finance-month-card").first()).toContainText("R$ 0,00");
  await expect(page.getByRole("heading", { name: "Suas estimativas aparecerão aqui", exact: true })).toBeVisible();
});
