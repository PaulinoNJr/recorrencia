import { test, expect, Page } from "@playwright/test";

async function checkAddresses(page: Page) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!).addresses.map((address: { id: string; label: string }) => [address.id, address.label]))).toEqual([["casa", "Casa"], ["trabalho", "Trabalho"]]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.addresses.map((address: { id: string; label: string }) => [address.id, address.label])).toEqual([["casa", "Casa"], ["trabalho", "Trabalho"]]);
  expect(saved.addresses[0].street).toBe("Rua das Flores, 123 · Jardim Primavera");
  expect(saved.addresses[1].street).toBe("Av. Rebouças, 450 · Centro");
}

test("endereços permanecem no reinício, troca de login, cadastro, saída e restauração", async ({ page }, testInfo) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await checkAddresses(page);
  for (const email of ["primeiro@example.net", "segundo@example.org"]) {
    await page.goto("/entrar");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("teste");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/loja");
    await checkAddresses(page);
  }
  await page.goto("/cadastro");
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Paulino");
  await page.getByLabel("Sobrenome", { exact: true }).fill("Teste");
  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue("123.456.789-99");
  await page.getByLabel("Telefone", { exact: true }).fill("11999999999");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL("/loja");
  await checkAddresses(page);
  await page.getByRole("button", { name: "Menu da conta" }).click();
  const menu = page.locator(testInfo.project.name === "mobile" ? "#mobile-store-menu" : "#account-dropdown");
  await menu.getByRole("button", { name: "Sair", exact: true }).click();
  await checkAddresses(page);
  await page.getByRole("button", { name: "Restaurar dados do protótipo" }).click();
  await checkAddresses(page);
  await page.goto("/home");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await checkAddresses(page);
});

test("sessões antigas recuperam os endereços sem perder o endereço selecionado", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Iniciar uma nova experiência com a recorrência" }).click();
  await expect(page).toHaveURL("/loja");
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    saved.addresses = [];
    saved.draft.addressId = "trabalho";
    saved.purchase = { addressId: "casa" };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.locator(".mobile-delivery-context")).toContainText("Sumaré");
  await checkAddresses(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("covabra-prototype-v1")!));
  expect(saved.draft.addressId).toBe("trabalho");
  expect(saved.purchase.addressId).toBe("casa");
});
