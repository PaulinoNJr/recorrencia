import { test, expect } from "@playwright/test";
test("checkout de compra unica segue as etapas e preserva os dados", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/carrinho");
  await expect(
    page.getByRole("button", { name: "Finalizar pedido", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("radio", { name: "Reembolso do valor", exact: true })
    .check();
  await page.getByRole("radio", { name: "Não", exact: true }).check();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-real-cart.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Finalizar pedido", exact: true })
    .click();
  await expect(page).toHaveURL("/checkout");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("cliente@example.com");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-email.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Robson");
  await page
    .getByRole("textbox", { name: "Sobrenome", exact: true })
    .fill("Cliente");
  await page
    .getByRole("textbox", { name: "CPF", exact: true })
    .fill("12345678901");
  await page
    .getByRole("textbox", { name: "Telefone", exact: true })
    .fill("11999999999");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nome", exact: true }),
  ).toHaveValue("Robson");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-data.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ir para entrega", exact: true })
    .click();
  await page.getByRole("button", { name: /Trabalho/ }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-delivery.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Ir para pagamento", exact: true })
    .click();
  await page.getByRole("button", { name: /Visa/ }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-checkout-payment.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Compra realizada!" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
