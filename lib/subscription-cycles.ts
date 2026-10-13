import { frequencies } from "@/data/products";
import { CycleDeliveries, SubscriptionItem } from "@/types";
import { total } from "./utils";

export function subscriptionCycles(
  items: SubscriptionItem[],
  date: string,
  period: string,
  deliveries?: CycleDeliveries,
) {
  return frequencies
    .map((frequency) => ({
      frequency,
      items: items.filter((item) => item.frequency === frequency),
      date: deliveries?.[frequency]?.date ?? date,
      period: deliveries?.[frequency]?.period ?? period,
    }))
    .filter((cycle) => cycle.items.length);
}
export function firstCycle(cycles: ReturnType<typeof subscriptionCycles>) {
  return [...cycles].sort((a, b) => a.date.localeCompare(b.date))[0];
}
export function cycleEstimate(cycles: ReturnType<typeof subscriptionCycles>) {
  return cycles.reduce((sum, cycle) => sum + total(cycle.items) + 9.9, 0);
}
