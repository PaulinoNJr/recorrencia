import { test, expect } from "./fixtures";
import { cycleSchedule } from "../lib/cycle-schedule";

test("dia semanal corresponde à data escolhida, incluindo fins de semana", () => {
  const days = ["todo Domingo", "toda Segunda-Feira", "toda Terça-Feira", "toda Quarta-Feira", "toda Quinta-Feira", "toda Sexta-Feira", "todo Sábado"];
  days.forEach((day, index) => {
    expect(cycleSchedule("Toda semana", `2026-10-${18 + index}`)).toBe(`Você receberá a sua compra ${day}.`);
  });
});

test("revisão informa a frequência e o início de cada ciclo e atualiza após editar", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-19T15:00:00Z") });
  await page.goto("/loja");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("covabra-prototype-v1")!);
    const frequencies = ["Toda semana", "A cada 15 dias", "Todo mês", "A cada 2 meses"];
    state.draft = {
      ...state.draft,
      items: ["leite", "papel", "cafe", "feijao"].map((productId, i) => ({ productId, quantity: 1, frequency: frequencies[i] })),
      frequencyPending: [],
      cycleDeliveries: Object.fromEntries(frequencies.map((frequency, i) => [frequency, { date: `2026-10-${19 + i}`, period: "08h às 12h" }])),
    };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.goto("/assinatura/revisao");
  const messages = [
    "Você receberá a sua compra toda Segunda-Feira.",
    "Você receberá a sua compra a cada 15 dias, a partir de Terça-Feira (20/10/2026).",
    "Você receberá a sua compra todo mês, a partir de Quarta-Feira (21/10/2026).",
    "Você receberá a sua compra a cada 2 meses, a partir de Quinta-Feira (22/10/2026).",
  ];
  await expect(page.locator(".cycle-schedule")).toHaveText(messages);
  await page.getByRole("button", { name: "Editar ciclo · Toda semana", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Data de entrega").fill("2026-10-23");
  await dialog.getByRole("button", { name: "Salvar ciclo" }).click();
  await expect(page.locator(".cycle-schedule").first()).toHaveText("Você receberá a sua compra toda Sexta-Feira.");
  await page.reload();
  await expect(page.locator(".cycle-schedule").first()).toHaveText("Você receberá a sua compra toda Sexta-Feira.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  if (testInfo.project.name === "mobile") {
    for (const width of [320, 360, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      for (const card of await page.locator(".review-cycle").all()) {
        const editBox = await card.getByRole("button", { name: /Editar ciclo/ }).boundingBox();
        expect(editBox!.width).toBeGreaterThanOrEqual(48);
        expect(editBox!.height).toBeGreaterThanOrEqual(48);
        const schedule = card.locator(".cycle-schedule");
        expect(await schedule.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBeTruthy();
        expect(await schedule.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
      }
      await page.screenshot({ path: `test-results/review-mobile-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 844, height: 390 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole("checkbox").check();
    await expect(page.getByRole("button", { name: "Confirmar assinatura", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "termos da assinatura", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: /Fechar/ }).click();
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-cycle-schedule.png`, fullPage: true });
});
