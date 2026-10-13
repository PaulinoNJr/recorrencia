import { test, expect } from "./fixtures";

test("nova experiência limpa os dados anteriores e permanece limpa após recarregar", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Aumentar quantidade" }).first().click();
  await page.evaluate(async () => {
    const previous = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    previous.lastCreated = "old-test";
    previous.purchase = { email: "previous@example.com" };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(previous));
    localStorage.setItem("old-test", "previous participant");
    sessionStorage.setItem("old-test", "previous participant");
    await caches.open("old-test");
  });
  await page.goto("/");
  const start = page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" });
  await expect(start).toBeEnabled();
  await expect(page.getByRole("button", { name: "Responder formulário" })).toBeDisabled();
  // Visiting the entry page must preserve the current participant's progress.
  expect(await page.evaluate(() => localStorage.getItem("old-test"))).not.toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-experience-home.png`, fullPage: true });
  await start.click();
  await expect(page).toHaveURL("/loja");
  await page.reload();
  const saved = await page.evaluate(async () => ({
    state: JSON.parse(localStorage.getItem("covabra-prototype-v1")!),
    local: localStorage.getItem("old-test"),
    session: sessionStorage.getItem("old-test"),
    caches: await caches.keys(),
  }));
  expect(saved.state.cart).toEqual([]);
  expect(saved.state.subscriptions).toEqual([]);
  expect(saved.state.draft.items).toEqual([]);
  expect(saved.state.lastCreated).toBeNull();
  expect(saved.state.purchase).toBeUndefined();
  expect(saved.state.customer).toBeNull();
  expect(saved.state.addresses).toEqual([]);
  expect(saved.state.payments).toEqual([]);
  expect(saved.local).toBeNull();
  expect(saved.session).toBeNull();
  expect(saved.caches).not.toContain("old-test");
  await expect(page.locator(".cart-link b")).toHaveText("0");
  await page.getByRole("button", { name: "Menu da conta" }).click();
  const menu = page.locator(testInfo.project.name === "mobile" ? "#mobile-store-menu" : "#account-dropdown");
  await expect(menu.getByRole("link", { name: /Recorrências/ })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Cadastrar-se", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".home-product").first().getByRole("button", { name: "Eu quero!", exact: true }).click();
  await expect(page.locator(".cart-link b")).toHaveText("1");
  await page.goto("/");
  await start.click();
  await expect(page).toHaveURL("/loja");
  await expect(page.locator(".cart-link b")).toHaveText("0");
  expect(errors).toEqual([]);
});
