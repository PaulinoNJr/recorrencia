import type { PrototypeState, Subscription } from "@/types";
import { subscriptionCycles } from "./subscription-cycles";

// Keep the original ID for one cycle and allocate unique IDs for its siblings.
export function withIndependentSubscriptions(state: PrototypeState): PrototypeState {
  let nextId = Math.max(126, ...state.subscriptions.map((subscription) => Number(subscription.id))) + 1;
  let changed = false;
  const subscriptions = state.subscriptions.flatMap((subscription): Subscription[] => {
    const cycles = subscriptionCycles(subscription.items, subscription.date, subscription.period, subscription.cycleDeliveries);
    if (cycles.length <= 1) return [subscription];
    changed = true;
    return cycles.map((cycle, index) => ({
      ...subscription,
      id: index === 0 ? subscription.id : String(nextId++).padStart(5, "0"),
      originId: subscription.originId ?? subscription.id,
      items: cycle.items,
      date: cycle.date,
      period: cycle.period,
      cycleDeliveries: { [cycle.frequency]: { date: cycle.date, period: cycle.period } },
    }));
  });
  return changed ? { ...state, subscriptions } : state;
}
