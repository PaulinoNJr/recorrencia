import { test, expect } from "@playwright/test";
test("criação, edição e gerenciamento persistem", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Incluir Leite integral Shefa na assinatura",
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Incluir Papel higiênico folha dupla na assinatura",
    })
    .check();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Todo mês");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-configurar.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await page.getByRole("button", { name: /Trabalho/ }).click();
  await page.getByRole("button", { name: /Tarde/ }).click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByRole("button", { name: /Visa/ }).click();
  await page.getByRole("button", { name: "Revisar assinatura" }).click();
  await page.getByRole("checkbox").check();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-revisao.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Confirmar assinatura" }).click();
  await expect(
    page.getByRole("heading", { name: "Sua assinatura foi criada!" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-sucesso.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Ver minha assinatura" }).click();
  await expect(
    page.getByRole("heading", { name: "Assinatura #00127" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editar produtos" }).first().click();
  await page
    .getByRole("button", { name: "Aumentar quantidade" })
    .first()
    .click();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("A cada 2 meses");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.reload();
  await expect(page.getByText("5 unidades")).toBeVisible();
  await page.getByRole("button", { name: "Pular próxima entrega" }).click();
  await page.getByRole("button", { name: "Pular esta entrega" }).click();
  await expect(page.getByRole("status")).toContainText("pulada");
  await page.getByRole("button", { name: "Pausar assinatura" }).click();
  await page.getByRole("button", { name: "15 dias", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar pausa" }).click();
  await page.reload();
  await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reativar assinatura" }).click();
  await page
    .getByRole("button", { name: "Alterar pagamento", exact: true })
    .click();
  await page.getByRole("button", { name: /Mastercard/ }).click();
  await page.getByRole("button", { name: "Salvar pagamento" }).click();
  await page.getByRole("link", { name: "Ver histórico" }).click();
  await expect(
    page.getByRole("heading", { name: "Uma história de praticidade" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar para assinatura" }).click();
  await page
    .getByRole("button", { name: "Cancelar assinatura", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await page.reload();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await page.goto("/minhas-assinaturas");
  await page.getByRole("tab", { name: /Canceladas/ }).click();
  await expect(page.getByText("ASSINATURA #00127")).toBeVisible();
  expect(errors).toEqual([]);
});
test("substituição, histórico e pagamento recusado", async ({ page }) => {
  await page.goto("/minhas-assinaturas/00124");
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
    await expect(page.locator("h1")).toBeVisible();
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
