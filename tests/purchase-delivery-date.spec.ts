import { test, expect } from "./fixtures";

test.use({ timezoneId: "Asia/Tokyo" });

test("compra permite somente os três próximos dias de São Paulo", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-09T01:00:00Z") });
  await page.goto("/checkout/entrega");
  const date = page.getByLabel("Data de entrega");
  const next = page.getByRole("button", { name: "Ir para pagamento", exact: true });
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
  await page.goto("/checkout/pagamento");
  await expect(page.getByRole("heading", { name: "Escolha a data da entrega" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar à entrega" }).click();
  await expect(page).toHaveURL("/checkout/entrega");
  await date.fill("2026-10-11");
  await next.click();
  await expect(page).toHaveURL("/checkout/pagamento");
  await expect(page.getByRole("button", { name: "Confirmar compra", exact: true })).toBeEnabled();
});

test("intervalo de compra se atualiza na virada do dia e do ano", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-12-31T02:59:30Z") });
  await page.goto("/checkout/entrega");
  const date = page.getByLabel("Data de entrega");
  await expect(date).toHaveAttribute("min", "2026-12-31");
  await expect(date).toHaveAttribute("max", "2027-01-02");
  await date.fill("2026-12-31");
  await page.clock.fastForward(90000);
  await expect(date).toHaveAttribute("min", "2027-01-01");
  await expect(date).toHaveAttribute("max", "2027-01-03");
  await expect(date).toHaveValue("");
  await expect(page.getByRole("button", { name: "Ir para pagamento", exact: true })).toBeDisabled();
});
