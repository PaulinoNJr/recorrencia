import { test, expect } from "./fixtures";
test("cliente aprende e escolhe os produtos da assinatura", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/recorrencias");
  await expect(page.getByRole("heading", { level: 1, name: "Seus essenciais em dia. Mais tempo para você." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Minhas assinaturas", exact: true }).last()).toHaveAttribute("href", "/minhas-assinaturas");
  await expect(page.getByRole("heading", { name: "Como funciona", exact: true })).toBeVisible();
  const createButton = page.getByRole("button", { name: "Criar minha assinatura", exact: true });
  await expect(createButton).toBeInViewport();
  if (testInfo.project.name === "desktop") {
    await expect(page.locator(".recurrence-guide li").last()).toBeInViewport();
  }
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-recurrence-identity.png`,
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "Como funciona" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Criar minha assinatura" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-subscription-source.png`,
  });
  await page.getByRole("button", { name: /Do meu carrinho atual/ }).click();
  await expect(page).toHaveURL("/assinatura/configurar");
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
  );
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "Monte sua assinatura" }),
  ).toBeVisible();
  await page.goto("/recorrencias");
  await page
    .getByRole("button", { name: "Criar minha assinatura", exact: true })
    .click();
  await page.getByRole("button", { name: /Do catálogo de produtos/ }).click();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page
    .getByRole("searchbox", { name: "Buscar no catálogo de produtos" })
    .fill("leite");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("checkbox").check();
  await page.locator(".subscription-product.selected").getByRole("button", { name: "Aumentar quantidade" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar no catálogo de produtos" })
    .fill("xyz-inexistente");
  await expect(
    page.getByRole("heading", { name: "Nenhum produto encontrado" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver todos os produtos", exact: true })
    .click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).cart,
    ),
  ).toEqual(before);
  await page.reload();
  await expect(
    page.getByRole("searchbox", { name: "Buscar no catálogo de produtos" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
  await expect(page).toHaveURL("/assinatura/entrega");
  expect(errors).toEqual([]);
});

test("recorrências se adapta a celulares e tablet sem cortes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validação das larguras móveis");
  for (const width of [320, 360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/recorrencias");
    const createButton = page.getByRole("button", { name: "Criar minha assinatura", exact: true });
    await expect(createButton).toBeEnabled();
    const box = await createButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    expect(box!.y + box!.height).toBeLessThan(844 - 72);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    for (const step of await page.locator(".recurrence-guide li").all()) {
      const stepBox = await step.boundingBox();
      expect(stepBox!.x).toBeGreaterThanOrEqual(0);
      expect(stepBox!.x + stepBox!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/recorrencias-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/recorrencias");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const createButton = page.getByRole("button", { name: "Criar minha assinatura", exact: true });
  await createButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
