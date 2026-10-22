import { addDays } from "./utils";
import type { Frequency } from "@/types";

export function saoPauloToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function firstDeliveryWindow(now = new Date()) {
  const today = saoPauloToday(now);
  return { min: addDays(today, 1), max: addDays(today, 3) };
}
export function validFirstDelivery(
  date: string,
  window = firstDeliveryWindow(),
) {
  return [window.min, addDays(window.min, 1), window.max].includes(date);
}

export function validSubscriptionDelivery(date: string, today = saoPauloToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date && date >= today;
}

export function firstSubscriptionDelivery(frequency: Frequency, today = saoPauloToday()) {
  if (frequency === "Toda semana") return addDays(today, 7);
  if (frequency === "A cada 2 semanas") return addDays(today, 14);
  return addDays(today, frequency === "Todo mês" ? 30 : 60);
}
