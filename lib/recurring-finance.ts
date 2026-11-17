import type { Frequency, Subscription } from "@/types";
import { subscriptionCycles } from "./subscription-cycles";
import { validSubscriptionDelivery } from "./delivery-date";
import { addDays, total } from "./utils";
import { FREQUENCY_DAYS } from "./frequency";

export const ESTIMATED_FREIGHT_CENTS = 990;

export interface EstimatedCharge {
  subscriptionId: string;
  name: string;
  frequency: Frequency;
  date: string;
  productsCents: number;
  freightCents: number;
  totalCents: number;
  paymentPending: boolean;
}

function calendarMonth(today: string, offset: number) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1 + offset;
  const date = new Date(Date.UTC(year, month, 1, 12));
  const start = date.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month + 1, 1, 12)).toISOString().slice(0, 10);
  const name = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(date);
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return { key: start.slice(0, 7), start, end, label, year: date.getUTCFullYear() };
}

function monthCosts(charges: EstimatedCharge[], month: ReturnType<typeof calendarMonth>) {
  const deliveries = charges.filter((charge) => charge.date >= month.start && charge.date < month.end);
  const productsCents = deliveries.reduce((sum, charge) => sum + charge.productsCents, 0);
  const freightCents = deliveries.reduce((sum, charge) => sum + charge.freightCents, 0);
  return { ...month, count: deliveries.length, firstDate: deliveries.map((charge) => charge.date).sort()[0], productsCents, freightCents, totalCents: productsCents + freightCents };
}

export function projectRecurringCosts(subscriptions: Subscription[], today: string) {
  const calendar = [0, 1, 2].map((offset) => calendarMonth(today, offset));
  const monthStart = calendar[0].start;
  const monthEnd = calendar[0].end;
  const horizonEnd = calendar[2].end;
  const charges: EstimatedCharge[] = [];
  const rows = subscriptions.map((subscription) => {
    const subscriptionCharges: EstimatedCharge[] = [];
    const nextDates: string[] = [];
    if (subscription.status === "Ativa") {
      for (const cycle of subscriptionCycles(subscription.items, subscription.date, subscription.period, subscription.cycleDeliveries)) {
        if (!validSubscriptionDelivery(cycle.date, cycle.date)) continue;
        const days = FREQUENCY_DAYS[cycle.frequency];
        const firstOccurrence = (from: string) => {
          const elapsed = (Date.parse(from + "T12:00:00Z") - Date.parse(cycle.date + "T12:00:00Z")) / 86400000;
          return addDays(cycle.date, Math.max(0, Math.ceil(elapsed / days)) * days);
        };
        const firstDate = firstOccurrence(monthStart);
        const nextDate = firstOccurrence(today);
        const validItems = cycle.items.filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
        if (!validItems.length) continue;
        // A one-off skip applies only to the next occurrence, not every future cycle.
        nextDates.push(validItems.every((item) => item.skipOnce) ? addDays(nextDate, days) : nextDate);
        for (let date = firstDate; date < horizonEnd; date = addDays(date, days)) {
          const items = date === nextDate ? validItems.filter((item) => !item.skipOnce) : validItems.map((item) => ({ ...item, skipOnce: false }));
          if (!items.length) continue;
          const productsCents = Math.round(total(items) * 100);
          subscriptionCharges.push({
            subscriptionId: subscription.id,
            name: subscription.name,
            frequency: cycle.frequency,
            date,
            productsCents,
            freightCents: ESTIMATED_FREIGHT_CENTS,
            totalCents: productsCents + ESTIMATED_FREIGHT_CENTS,
            paymentPending: subscription.paymentStatus === "Recusado",
          });
        }
      }
    }
    charges.push(...subscriptionCharges);
    const months = calendar.map((month) => monthCosts(subscriptionCharges, month));
    return {
      subscription,
      nextDate: nextDates.sort()[0],
      months,
      count: months[0].count,
      productsCents: months[0].productsCents,
      freightCents: months[0].freightCents,
      totalCents: months[0].totalCents,
    };
  });
  charges.sort((a, b) => a.date.localeCompare(b.date) || a.subscriptionId.localeCompare(b.subscriptionId) || a.frequency.localeCompare(b.frequency));
  const months = calendar.map((month) => monthCosts(charges, month));
  return {
    today,
    monthStart,
    monthEnd,
    horizonEnd,
    months,
    rows,
    charges,
    upcomingCharges: charges.filter((charge) => charge.date >= today),
    monthlyCount: months[0].count,
    productsCents: months[0].productsCents,
    freightCents: months[0].freightCents,
    totalCents: months[0].totalCents,
  };
}
