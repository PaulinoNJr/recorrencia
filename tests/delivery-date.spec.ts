import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });
async function openDelivery(page: Page, frequency = "Toda semana") {
  await page.goto("/carrinho");
  await page
    .getByRole("button", { name: "Criar assinatura", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Incluir Leite integral Shefa na assinatura",
    })
    .check();
  await page.locator(".subscription-product.selected").getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("button", { name: "Continuar para frequência" }).click();
  await page
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption(frequency);
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
}

test("primeira entrega e calculada pela frequencia e preserva ajustes manuais", async ({ page }) => {
  await page.clock.install({ time: new Date("2027-01-31T15:00:00Z") });
  for (const [frequency, expected] of [
    ["Toda semana", "2027-02-07"],
    ["A cada 2 semanas", "2027-02-14"],
    ["Todo mês", "2027-03-02"],
    ["A cada 2 meses", "2027-04-01"],
  ]) {
    await openDelivery(page, frequency);
    const date = page.getByLabel("Data de entrega");
    await expect(date).toHaveValue(expected);
    await page.reload();
    await expect(date).toHaveValue(expected);
    await date.fill("2027-04-20");
    await page.getByRole("button", { name: "Continuar para pagamento" }).click();
    await page.goto("/assinatura/entrega");
    await expect(date).toHaveValue("2027-04-20");
  }
});

test("primeira entrega aceita hoje e qualquer data futura de Sao Paulo", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-09T01:00:00Z") });
  await openDelivery(page);
  const date = page.getByLabel("Data de entrega");
  const next = page.getByRole("button", { name: "Continuar para pagamento" });
  await expect(date).toHaveAttribute("min", "2026-10-08");
  await expect(date).not.toHaveAttribute("max");
  for (const value of ["2026-10-08", "2026-10-09", "2099-01-01"]) {
    await date.fill(value);
    await expect(next).toBeEnabled();
  }
  for (const value of ["2026-10-07", ""]) {
    await date.fill(value);
    await expect(next).toBeDisabled();
  }
  await date.fill("2026-10-07");
  await page.reload();
  await expect(date).toHaveValue("");
  await expect(next).toBeDisabled();
  await page.goto("/assinatura/pagamento");
  await expect(
    page.getByRole("heading", { name: "Escolha a data da primeira entrega" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar à entrega" }).click();
  await date.fill("2099-01-01");
  await next.click();
  await expect(page).toHaveURL("/assinatura/pagamento");
});

test("data minima acompanha virada de dia com a pagina aberta", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-12-31T02:59:30Z") });
  await openDelivery(page);
  const date = page.getByLabel("Data de entrega");
  await expect(date).toHaveAttribute("min", "2026-12-30");
  await expect(date).not.toHaveAttribute("max");
  await date.fill("2026-12-30");
  await expect(
    page.getByRole("button", { name: "Continuar para pagamento" }),
  ).toBeEnabled();
  await page.clock.fastForward(90000);
  await expect(date).toHaveAttribute("min", "2026-12-31");
  await expect(date).not.toHaveAttribute("max");
  await expect(date).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Continuar para pagamento" }),
  ).toBeDisabled();
});
