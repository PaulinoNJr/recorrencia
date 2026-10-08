import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/recorrencias",
  "/comprar",
  "/cupons",
  "/listas",
  "/carrinho",
  "/assinatura/configurar",
  "/assinatura/entrega",
  "/assinatura/pagamento",
  "/assinatura/revisao",
  "/assinatura/sucesso",
  "/checkout",
  "/checkout/dados",
  "/checkout/entrega",
  "/checkout/pagamento",
  "/checkout/sucesso",
  "/minhas-assinaturas",
  "/minhas-assinaturas/00124",
  "/minhas-assinaturas/00124/editar",
  "/minhas-assinaturas/00124/historico",
  "/operacao",
  "/operacao/assinaturas/00124",
];
async function seed(page: import("@playwright/test").Page) {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    state.draft.items = state.cart.slice(0, 2);
    state.draft.frequencyPending = [];
    state.lastCreated = "00124";
    state.purchase = {
      email: "cliente@example.com",
      firstName: "Robson",
      lastName: "Cliente",
      cpf: "12345678901",
      phone: "11999999999",
      addressId: "casa",
      paymentId: "master",
    };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
}
test("todas as telas cabem no celular e possuem controles de toque", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await seed(page);
  for (const width of [320, 360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1").first()).toBeAttached();
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        smallControls: [
          ...document.querySelectorAll<HTMLElement>(
            "main button:not(.hero-dots button), main select, main input:not([type='checkbox']):not([type='radio'])",
          ),
        ]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.height < 44;
          })
          .map(
            (el) =>
              el.getAttribute("aria-label") || el.textContent?.slice(0, 40),
          ),
        zoomInputs: [
          ...document.querySelectorAll<HTMLElement>(
            "input:not([type='checkbox']):not([type='radio']), select, textarea",
          ),
        ]
          .filter(
            (el) =>
              el.getBoundingClientRect().width > 0 &&
              parseFloat(getComputedStyle(el).fontSize) < 16,
          )
          .map((el) => el.getAttribute("aria-label") || el.tagName),
      }));
      expect(result.overflow, `${route} em ${width}px`).toBeFalsy();
      expect(result.smallControls, `${route} em ${width}px`).toEqual([]);
      expect(result.zoomInputs, `${route} em ${width}px`).toEqual([]);
      if (width <= 430 && route.endsWith("/00124")) {
        const timeline = page.locator(".cycle-steps");
        const lineWidth = (await timeline.boundingBox())!.width;
        const rowWidth = (await timeline
          .locator(":scope > div")
          .first()
          .boundingBox())!.width;
        expect(rowWidth).toBeGreaterThanOrEqual(lineWidth - 1);
      }
    }
  }
});
test("menu e modais funcionam em telas pequenas e na horizontal", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu de Robson" }).tap();
    const bounds = await page.locator("#mobile-store-menu").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page
      .getByRole("link", { name: "Minhas listas", exact: true })
      .click();
    await expect(page).toHaveURL("/listas");
    await page.goto("/recorrencias");
    await page
      .getByRole("button", { name: "Quero criar minha assinatura" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const modal = await page.getByRole("dialog").boundingBox();
    expect(modal!.width).toBeLessThanOrEqual(width - 24);
    await page.getByRole("button", { name: /Do catálogo de produtos/ }).click();
    await expect(page.locator("#subscription-search")).toBeVisible();
    await page.goto("/minhas-assinaturas/00124");
    await page
      .getByRole("button", { name: "Pausar assinatura", exact: true })
      .click();
    await page.setViewportSize({ width: 844, height: 390 });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const landscape = await dialog.boundingBox();
    expect(landscape!.height).toBeLessThanOrEqual(374);
    await page.getByRole("button", { name: "15 dias", exact: true }).click();
    await page
      .getByRole("button", { name: "Confirmar pausa", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await page
      .getByRole("button", { name: "Reativar assinatura", exact: true })
      .click();
  }
});
