import { test, expect } from "./fixtures";
test("criação, edição e gerenciamento persistem", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar compra recorrente", exact: true })
    .click();
  await expect(page).toHaveURL("/assinatura/configurar");
  await expect(page.locator(".subscription-config")).toBeVisible();
  const originalCart = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart);
  await page.getByRole("radio", { name: "Reembolso do valor" }).check();
  await page.getByRole("radio", { name: "Sim", exact: true }).check();
  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue("123.456.789-99");
  await expect(page.getByLabel("CPF", { exact: true })).toHaveAttribute("readonly", "");
  await page
    .getByRole("checkbox", {
      name: "Incluir Leite integral Shefa na compra recorrente",
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Incluir Papel higiênico folha dupla na compra recorrente",
    })
    .check();
  for (let count = 0; count < 4; count++)
    await page.locator(".subscription-product.selected").first().getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.locator(".subscription-product.selected").last().getByRole("button", { name: "Aumentar quantidade" }).click();

  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Mensal");
  await page
    .getByLabel("Frequência de Papel higiênico folha dupla")
    .selectOption("Quinzenal");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-configurar.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await page.getByRole("button", { name: /Trabalho/ }).click();
  await page.getByRole("button", { name: /Tarde/ }).first().click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: /Visa/ }).click();
  await page.getByRole("button", { name: "Revisar compra recorrente" }).click();
  await page.getByRole("checkbox").check();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-revisao.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Confirmar compra recorrente" }).click();
  await expect(
    page.getByRole("heading", { name: "Suas compras recorrentes foram criadas!" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-sucesso.png`,
    fullPage: true,
  });
  const id = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    return state.subscriptions.find((subscription: { originId: string; items: { productId: string }[] }) => subscription.originId === state.lastCreated && subscription.items.some((item) => item.productId === "leite")).id;
  });
  const createdOptions = await page.evaluate((subscriptionId) => {
    const saved = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    return saved.subscriptions.find((subscription: { id: string }) => subscription.id === subscriptionId);
  }, id);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart)).toEqual(originalCart);
  expect(createdOptions).toMatchObject({ substitute: "Reembolso do valor", invoice: "Sim", cpf: "123.456.789-99" });
  const createdNames = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    return state.subscriptions.filter((subscription: { originId?: string }) => subscription.originId === state.lastCreated).map((subscription: { name: string }) => subscription.name);
  });
  expect(createdNames.sort()).toEqual(["Essenciais da casa · Mensal", "Essenciais da casa · Quinzenal"]);
  await page.getByRole("region", { name: "Resumo do ciclo · Mensal" }).getByRole("link", { name: "Ver detalhes desta compra recorrente" }).click();
  await expect(
    page.getByRole("heading", { name: `Compra recorrente #${id}` }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editar produtos" }).first().click();
  await page
    .getByRole("button", { name: "Aumentar quantidade" })
    .first()
    .click();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Semanal");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL(`/minhas-assinaturas/${id}`);
  await page.reload();
  await expect(page.getByText("5 unidades")).toBeVisible();
  await page.getByRole("button", { name: "Pular próxima entrega" }).click();
  await page.getByRole("button", { name: "Pular esta entrega" }).click();
  await expect(page.getByRole("status")).toContainText("pulada");
  await page.getByRole("button", { name: "Pausar compra recorrente" }).click();
  await page.getByRole("button", { name: "15 dias", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar pausa" }).click();
  await page.reload();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reativar compra recorrente" }).click();
  await page
    .getByRole("button", { name: "Alterar pagamento", exact: true })
    .click();
  await page.getByRole("button", { name: /Mastercard/ }).click();
  await page.getByRole("button", { name: "Salvar pagamento" }).click();
  await page.getByRole("link", { name: "Ver histórico" }).click();
  await expect(
    page.getByRole("heading", { name: "Uma história de praticidade" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar para compra recorrente" }).click();
  await page
    .getByRole("button", { name: "Cancelar compra recorrente", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await page.reload();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await page.goto("/minhas-assinaturas");
  await page.getByRole("tab", { name: /Canceladas/ }).click();
  await expect(page.getByText(`COMPRA RECORRENTE #${id}`)).toBeVisible();
  expect(errors).toEqual([]);
});
test("substituição, histórico e pagamento recusado", async ({ page }) => {
  await page.goto("/minhas-assinaturas");
  await page.getByRole("article").filter({ hasText: "Essenciais de casa" }).filter({ hasText: "Mensal" }).getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByRole("button", { name: "Escolher substituto" }).click();
  await page.getByRole("button", { name: "Confirmar substituição" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Café seleção tradicional" }),
  ).toBeVisible();
  await page.goto("/minhas-assinaturas/00126");
  await page.getByRole("button", { name: "Atualizar cartão" }).click();
  await page.getByRole("button", { name: "Adicionar cartão fictício" }).click();
  await page
    .getByRole("button", { name: "Adicionar cartão", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar pagamento" }).click();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  await page.goto("/minhas-assinaturas/00124/historico");
  await page.getByRole("button", { name: /18\/09\/2026/ }).click();
  await expect(
    page.getByRole("heading", { name: "Detalhes do ciclo · 18/09/2026" }),
  ).toBeVisible();
});
test("rotas e layout sem overflow", async ({ page }, testInfo) => {
  for (const route of [
    "/carrinho",
    "/comprar",
    "/cupons",
    "/listas",
    "/assinatura/configurar",
    "/minhas-assinaturas",
    "/minhas-assinaturas/00124",
    "/minhas-assinaturas/00124/editar",
    "/minhas-assinaturas/00124/historico",
    "/operacao",
    "/operacao/assinaturas/00124",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (
      [
        "/carrinho",
        "/minhas-assinaturas",
        "/minhas-assinaturas/00124",
      ].includes(route)
    )
      await page.screenshot({
        path: `test-results/${testInfo.project.name}-${route.replaceAll("/", "-")}.png`,
        fullPage: true,
      });
  }
});
