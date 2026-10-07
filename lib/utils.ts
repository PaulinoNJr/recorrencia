import { SubscriptionItem } from "@/types";
import { productById } from "@/data/products";
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR");
export const longDate = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
export const addDays = (date: string, days: number) => {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const total = (items: SubscriptionItem[]) =>
  items
    .filter((i) => !i.skipOnce)
    .reduce(
      (sum, i) =>
        sum + productById(i.substituteId || i.productId).price * i.quantity,
      0,
    );
export const nextCycle = (items: SubscriptionItem[], date: string) =>
  addDays(
    date,
    Math.min(
      ...items.map(
        (i) =>
          ({
            "Toda semana": 7,
            "A cada 15 dias": 15,
            "Todo mês": 30,
            "A cada 2 meses": 60,
          })[i.frequency],
      ),
    ),
  );
