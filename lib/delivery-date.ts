import { addDays } from "./utils";

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
