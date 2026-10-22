import { test, expect, Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await expect(page.getByText("Robson", { exact: false })).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.customer).toBeNull();
  expect(saved.addresses.map((address: { label: string }) => address.label)).toEqual(["Casa", "Trabalho"]);
  expect(saved.payments).toHaveLength(1);
  expect(saved.payments[0].id).toBe("master");
  await page.locator(".home-product").first().getByRole("button", { name: "Eu quero!", exact: true }).click();
  await page.goto("/carrinho");
}

async function identify(page: Page) {
  await expect(page.getByLabel("Nome", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Sobrenome", { exact: true })).toHaveCount(0);
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("teste");
}

async function addAddress(page: Page) {
  await page.getByRole("button", { name: "Adicionar outro endereço", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome do endereço").fill("Casa de teste");
  await dialog.getByLabel("Rua, número e bairro").fill("Rua de teste, 10 · Centro");
  await dialog.getByLabel("Cidade e estado").fill("Campinas – SP");
  await dialog.getByLabel("CEP").fill("13000-000");
  await dialog.getByRole("button", { name: "Salvar endereço" }).click();
}

async function addCard(page: Page) {
  await page.getByRole("button", { name: "Adicionar cartão fictício" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Adicionar cartão", exact: true }).click();
  await expect(page.locator(".choice-grid .chosen").getByText("Paulino", { exact: true })).toBeVisible();
}

test("visitante cria e gerencia recorrência com sua própria identificação", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.getByRole("button", { name: "Criar assinatura", exact: true }).click();
  await page.getByRole("checkbox", { name: "Incluir Leite integral Shefa na assinatura" }).check();
  await page.locator(".subscription-product.selected").getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("button", { name: "Continuar para frequência" }).click();
  await page.getByLabel("Frequência de Leite integral Shefa").selectOption("Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
  await identify(page);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/assinatura/entrega");
  await expect(page.getByRole("button", { name: "Continuar para pagamento" })).toBeEnabled();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-guest-delivery.png`, fullPage: true });
  await addAddress(page);
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await expect(page.getByRole("button", { name: "Revisar assinatura" })).toBeEnabled();
  await addCard(page);
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await page.getByRole("link", { name: "Ver minha assinatura" }).click();
  await expect(page).toHaveURL("/minhas-assinaturas/00127");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Assinatura #00127" })).toBeVisible();
  await page.getByRole("button", { name: "Pausar assinatura", exact: true }).click();
  await page.getByRole("button", { name: "15 dias", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar pausa", exact: true }).click();
  await page.getByRole("button", { name: "Reativar assinatura", exact: true }).click();
  await page.goto("/operacao/assinaturas/00127");
  await expect(page.getByText("Paulino · ana@example.com", { exact: true })).toBeVisible();
  await expect(page.getByText(/Robson/)).toHaveCount(0);
  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await page.goto("/minhas-assinaturas/00127");
  await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("visitante finaliza compra e reaproveita seus dados na recorrência", async ({ page }) => {
  await start(page);
  await page.getByRole("radio", { name: "Reembolso do valor", exact: true }).check();
  await page.getByRole("radio", { name: "Não", exact: true }).check();
  await page.getByRole("button", { name: "Finalizar pedido", exact: true }).click();
  await expect(page).toHaveURL("/checkout");
  await identify(page);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/checkout/entrega");
  await expect(page.getByRole("button", { name: "Ir para pagamento", exact: true })).toBeEnabled();
  await addAddress(page);
  await page.getByRole("button", { name: "Ir para pagamento", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirmar compra", exact: true })).toBeEnabled();
  await addCard(page);
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compra realizada!" })).toBeVisible();
  await page.getByRole("button", { name: "Sim, tornar recorrente" }).click();
  await page.getByRole("button", { name: "Continuar para frequência" }).click();
  await page.getByLabel("Frequência de Leite integral Shefa").selectOption("Todo mês");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await expect(page).toHaveURL("/assinatura/entrega");
  await expect(page.getByRole("button", { name: "Continuar para pagamento" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(page.getByRole("heading", { name: "Sua assinatura foi criada!" })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(state.customer.firstName).toBe("Paulino");
  expect(state.customer.cpf).toBe("123.456.789-99");
  expect(state.subscriptions).toHaveLength(1);
  expect(state.cart).toEqual([]);
});

test("acesso direto às etapas exige identificação e não confirma compras inexistentes", async ({ page }) => {
  await page.goto("/loja");
  await expect(page.getByText(/Robson/)).toHaveCount(0);
  await page.goto("/assinatura/revisao");
  await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible();
  await identify(page);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Vamos escolher seus produtos?" })).toBeVisible();
  await page.goto("/checkout/sucesso");
  await expect(page.getByRole("heading", { name: "Compra realizada!" })).toHaveCount(0);
});
