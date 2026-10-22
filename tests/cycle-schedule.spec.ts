import { test, expect } from "./fixtures";
import { cycleSchedule } from "../lib/cycle-schedule";
import { migrateLegacyFrequency } from "../lib/legacy-frequency";
import { firstSubscriptionDelivery } from "../lib/delivery-date";
import { nextCycle } from "../lib/utils";

test("ciclo de duas semanas mantém o dia escolhido e recupera sessões antigas", () => {
  expect(cycleSchedule("A cada 2 semanas", "2026-11-05")).toBe("Você receberá a sua primeira compra em 05/11/2026. E as próximas a cada 2 semanas, sempre no mesmo dia da semana (Quinta-Feira).");
  expect(firstSubscriptionDelivery("A cada 2 semanas", "2026-10-23")).toBe("2026-11-06");
  expect(firstSubscriptionDelivery("A cada 2 semanas", "2028-02-23")).toBe("2028-03-08");
  expect(nextCycle([{ productId: "leite", quantity: 1, frequency: "A cada 2 semanas" }], "2026-12-25")).toBe("2027-01-08");
  const legacy = { items: [{ frequency: "A cada 15 dias", quantity: 2 }], cycleDeliveries: { "A cada 15 dias": { date: "2026-10-23", period: "08h às 12h" } } };
  expect(JSON.parse(JSON.stringify(legacy), migrateLegacyFrequency)).toEqual({ items: [{ frequency: "A cada 2 semanas", quantity: 2 }], cycleDeliveries: { "A cada 2 semanas": { date: "2026-10-23", period: "08h às 12h" } } });
});

test("mensal usa 30 dias para a primeira entrega e o próximo ciclo", () => {
  expect(firstSubscriptionDelivery("Todo mês", "2026-10-21")).toBe("2026-11-20");
  expect(cycleSchedule("Todo mês", "2026-11-20")).toBe("Você receberá a sua primeira compra em 20/11/2026.\n\nO próximo ciclo está pré-agendado para 20/12/2026.");
  for (const [date, nextDate] of [
    ["2026-01-31", "2026-03-02"],
    ["2028-01-31", "2028-03-01"],
    ["2026-12-20", "2027-01-19"],
    ["2028-02-29", "2028-03-30"],
  ]) {
    expect(firstSubscriptionDelivery("Todo mês", date)).toBe(nextDate);
    expect(nextCycle([{ productId: "leite", quantity: 1, frequency: "Todo mês" }], date)).toBe(nextDate);
  }
});

test("bimestral usa 60 dias para a primeira entrega e o próximo ciclo", () => {
  expect(firstSubscriptionDelivery("A cada 2 meses", "2026-10-21")).toBe("2026-12-20");
  expect(cycleSchedule("A cada 2 meses", "2026-12-20")).toBe("Você receberá a sua primeira compra em 20/12/2026.\n\nO próximo ciclo está pré-agendado para 18/02/2027.");
  for (const [date, nextDate] of [
    ["2026-11-20", "2027-01-19"],
    ["2026-12-20", "2027-02-18"],
    ["2028-01-31", "2028-03-31"],
  ]) {
    expect(firstSubscriptionDelivery("A cada 2 meses", date)).toBe(nextDate);
    expect(nextCycle([{ productId: "leite", quantity: 1, frequency: "A cada 2 meses" }], date)).toBe(nextDate);
  }
});

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
    const frequencies = ["Toda semana", "A cada 2 semanas", "Todo mês", "A cada 2 meses"];
    state.draft = {
      ...state.draft,
      items: ["leite", "papel", "cafe", "feijao"].map((productId, i) => ({ productId, quantity: 1, frequency: frequencies[i] })),
      frequencyPending: [],
      cycleDeliveries: Object.fromEntries(frequencies.map((frequency, i) => [frequency, { date: `2026-10-${19 + i}`, period: "08h às 12h" }])),
    };
    localStorage.setItem("covabra-prototype-v1", JSON.stringify(state));
  });
  await page.goto("/assinatura/entrega");
  const frequencies = ["Toda semana", "A cada 2 semanas", "Todo mês", "A cada 2 meses"] as const;
  for (const [index, frequency] of frequencies.entries()) {
    const group = page.getByRole("group", { name: `Entrega · ${frequency}`, exact: true });
    const dateInput = group.getByLabel(`Data de entrega · ${frequency}`);
    const message = group.getByRole("status");
    await expect(message).toHaveText(cycleSchedule(frequency, `2026-10-${19 + index}`));
    await dateInput.fill("2026-10-23");
    await expect(message).toHaveText(cycleSchedule(frequency, "2026-10-23"));
    await dateInput.fill("");
    await expect(message).toHaveText("Selecione uma data para ver quando você receberá a sua compra.");
    await dateInput.fill(`2026-10-${19 + index}`);
  }
  if (testInfo.project.name === "mobile") {
    for (const width of [320, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      const row = page.locator(".delivery-first-row").first();
      const inputBox = await row.locator("input").boundingBox();
      const messageBox = await row.getByRole("status").boundingBox();
      expect(messageBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
    }
    await page.setViewportSize({ width: 390, height: 844 });
  } else {
    const row = page.locator(".delivery-first-row").first();
    const inputBox = await row.locator("input").boundingBox();
    const messageBox = await row.getByRole("status").boundingBox();
    expect(messageBox!.x).toBeGreaterThanOrEqual(inputBox!.x + inputBox!.width);
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-delivery-schedule.png`, fullPage: true });
  await page.goto("/assinatura/revisao");
  const messages = [
    "Você receberá a sua compra toda Segunda-Feira.",
    "Você receberá a sua primeira compra em 20/10/2026. E as próximas a cada 2 semanas, sempre no mesmo dia da semana (Terça-Feira).",
    "Você receberá a sua primeira compra em 21/10/2026.\n\nO próximo ciclo está pré-agendado para 20/11/2026.",
    "Você receberá a sua primeira compra em 22/10/2026.\n\nO próximo ciclo está pré-agendado para 21/12/2026.",
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
