import { test, expect } from "@playwright/test";
import { initialState } from "../data/subscriptions";
import { cycleSubscriptionName, normalizeSubscriptionName, resolveSubscriptionName, suggestSubscriptionNames } from "../lib/subscription-name";

test("nomes sugeridos refletem produtos e nomes vazios recuperam a sugestao", () => {
  expect(suggestSubscriptionNames([])[0]).toBe("Essenciais da casa");
  expect(suggestSubscriptionNames([{ productId: "leite", quantity: 1, frequency: "Semanal" }])[0]).toBe("Café da manhã");
  expect(suggestSubscriptionNames([{ productId: "papel", quantity: 1, frequency: "Mensal" }])[0]).toBe("Cuidados da casa");
  expect(suggestSubscriptionNames([{ productId: "feijao", quantity: 1, frequency: "Mensal" }])[0]).toBe("Despensa em dia");
  expect(resolveSubscriptionName("   ", [])).toBe("Essenciais da casa");
  expect(normalizeSubscriptionName("  Compras   da família \n")).toBe("Compras da família");
});

test("nomes longos respeitam limite inclusive com a frequencia de cada recorrencia", () => {
  const name = "🛒".repeat(80);
  expect(Array.from(normalizeSubscriptionName(name))).toHaveLength(60);
  const cycleName = cycleSubscriptionName(name, "Quinzenal", true);
  expect(Array.from(cycleName).length).toBeLessThanOrEqual(60);
  expect(cycleName).toContain(" · Quinzenal");
  expect(cycleName).not.toContain("�");
  expect(cycleSubscriptionName("Café da manhã", "Mensal", false)).toBe("Café da manhã");
});

test("nome automatico pode ser personalizado, revisado e visto no painel e financeiro", async ({ page }, testInfo) => {
  const seed = initialState();
  seed.subscriptions = [];
  seed.cart = [{ productId: "leite", quantity: 3, frequency: "Semanal" }, { productId: "papel", quantity: 1, frequency: "Mensal" }];
  seed.draft.name = "Nome de uma configuração anterior";
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seed);
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Criar compra recorrente", exact: true }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  const name = page.getByLabel("Nome da compra recorrente", { exact: true });
  await expect(name).toHaveValue("Essenciais da casa");
  const milk = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Leite integral Shefa na compra recorrente" }) });
  const paper = page.locator(".subscription-product").filter({ has: page.getByRole("checkbox", { name: "Incluir Papel higiênico folha dupla na compra recorrente" }) });
  await milk.getByRole("checkbox").check();
  await milk.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(name).toHaveValue("Café da manhã");
  await name.fill("Compras da família");
  await paper.getByRole("checkbox").check();
  await expect(name).toHaveValue("Compras da família");
  await paper.getByRole("checkbox").uncheck();
  await milk.getByRole("combobox").selectOption("Mensal");
  await page.reload();
  await expect(name).toHaveValue("Compras da família");
  await expect(name).toHaveAttribute("maxlength", "60");
  await page.screenshot({ path: "test-results/" + testInfo.project.name + "-nome-recorrencia.png", fullPage: true });
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: "Revisar compra recorrente" }).click();
  await expect(name).toHaveValue("Compras da família");
  await name.fill("Café da família");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar compra recorrente" }).click();
  await expect(page).toHaveURL("/assinatura/sucesso");
  await expect(page.locator(".toast")).toContainText("Café da família");
  await expect(page.locator(".success-card > .subscription-display-name")).toHaveText("Café da família");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.subscriptions).toHaveLength(1);
  expect(saved.subscriptions[0].name).toBe("Café da família");
  expect(saved.cart).toEqual(seed.cart);
  await page.goto("/minhas-assinaturas");
  await expect(page.getByRole("heading", { name: "Café da família", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Minhas compras recorrentes", exact: true }).getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #" + saved.subscriptions[0].id, exact: true })).toContainText("Café da família");
  await page.goto("/minhas-assinaturas");
  await page.getByRole("link", { name: "Nova compra recorrente", exact: true }).click();
  await expect(name).toHaveValue("Essenciais da casa");
});

test("renomear preserva estado, historico e agenda e identifica os avisos do app", async ({ page }, testInfo) => {
  const seed = initialState();
  seed.subscriptions = [
    { ...seed.subscriptions[0], name: "Minha rotina", status: "Pausada", items: [seed.subscriptions[0].items[0]], pausedUntil: "2030-01-01" },
    { ...seed.subscriptions[1], name: "Casa organizada", status: "Cancelada", items: [{ productId: "papel", quantity: 1, frequency: "Mensal" }] },
  ];
  await page.addInitScript((state) => {
    if (!localStorage.getItem("covabra-prototype-v1")) localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  }, seed);
  await page.goto("/minhas-assinaturas/00124");
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  const original = before.subscriptions.find((sub: { id: string }) => sub.id === "00124");
  await page.getByRole("button", { name: "Editar nome", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const name = dialog.getByLabel("Nome da compra recorrente", { exact: true });
  await name.fill("Descartar este nome");
  await dialog.getByRole("button", { name: "Voltar sem salvar" }).click();
  await expect(page.locator(".page-heading")).toContainText("Minha rotina");
  await page.getByRole("button", { name: "Editar nome", exact: true }).click();
  await name.fill("  Despensa da família  ");
  await page.screenshot({ path: "test-results/" + testInfo.project.name + "-editar-nome.png" });
  await dialog.getByRole("button", { name: "Salvar nome" }).click();
  await expect(page.locator(".toast")).toContainText("Despensa da família");
  await page.reload();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  const renamed = saved.subscriptions.find((sub: { id: string }) => sub.id === "00124");
  expect(renamed.name).toBe("Despensa da família");
  expect({ ...renamed, name: original.name, events: original.events }).toEqual(original);
  expect(renamed.events[0]).toContain("Nome alterado");
  expect(saved.cart).toEqual(before.cart);
  await page.getByRole("button", { name: "Reativar compra recorrente", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Despensa da família");
  await expect(page.locator(".toast")).toContainText("reativada");
  await page.goto("/minhas-assinaturas/00125");
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar nome", exact: true }).click();
  await name.fill("   ");
  await dialog.getByRole("button", { name: "Salvar nome" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".toast")).toContainText("Cuidados da casa");
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.subscriptions.find((sub: { id: string }) => sub.id === "00125")).toMatchObject({ name: "Cuidados da casa", status: "Cancelada" });
  await page.goto("/minhas-assinaturas/financeiro");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00124", exact: true })).toContainText("Despensa da família");
  await expect(page.getByRole("article", { name: "Estimativa da compra recorrente #00125", exact: true })).toContainText("Cuidados da casa");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
