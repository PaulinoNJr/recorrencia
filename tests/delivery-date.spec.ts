import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });
async function openDelivery(page: Page) {
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
    .getByLabel("Frequência de Leite integral Shefa")
    .selectOption("Toda semana");
  await page.getByRole("button", { name: "Continuar para entrega" }).click();
}

test("primeira entrega aceita somente os proximos tres dias de Sao Paulo", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-09T01:00:00Z") });
  await openDelivery(page);
  const date = page.getByLabel("Data de entrega");
  const next = page.getByRole("button", { name: "Continuar para pagamento" });
  await expect(date).toHaveAttribute("min", "2026-10-09");
  await expect(date).toHaveAttribute("max", "2026-10-11");
  for (const value of ["2026-10-09", "2026-10-10", "2026-10-11"]) {
    await date.fill(value);
    await expect(next).toBeEnabled();
  }
  for (const value of ["2026-10-08", "2026-10-12", ""]) {
    await date.fill(value);
    await expect(next).toBeDisabled();
  }
  await date.fill("2026-10-15");
  await page.reload();
  await expect(date).toHaveValue("");
  await expect(next).toBeDisabled();
  await page.goto("/assinatura/pagamento");
  await expect(
    page.getByRole("heading", { name: "Escolha a data da primeira entrega" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar à entrega" }).click();
  await date.fill("2026-10-11");
  await next.click();
  await expect(page).toHaveURL("/assinatura/pagamento");
});

test("intervalo acompanha virada de dia e de ano com a pagina aberta", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-12-31T02:59:30Z") });
  await openDelivery(page);
  const date = page.getByLabel("Data de entrega");
  await expect(date).toHaveAttribute("min", "2026-12-31");
  await expect(date).toHaveAttribute("max", "2027-01-02");
  await date.fill("2026-12-31");
  await expect(
    page.getByRole("button", { name: "Continuar para pagamento" }),
  ).toBeEnabled();
  await page.clock.fastForward(90000);
  await expect(date).toHaveAttribute("min", "2027-01-01");
  await expect(date).toHaveAttribute("max", "2027-01-03");
  await expect(date).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Continuar para pagamento" }),
  ).toBeDisabled();
});
