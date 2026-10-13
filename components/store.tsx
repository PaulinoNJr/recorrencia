"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { guestState } from "@/data/subscriptions";
import { withFakeAddresses } from "@/data/addresses";
import { withFakeCustomer } from "@/data/customer";
import { withFakePayments } from "@/data/payments";
import { withIndependentSubscriptions } from "@/lib/independent-subscriptions";
import { PrototypeState, Subscription } from "@/types";
import { addDays } from "@/lib/utils";
interface Store {
  state: PrototypeState;
  setState: Dispatch<SetStateAction<PrototypeState>>;
  ready: boolean;
  notify: (message: string) => void;
  updateSubscription: (
    id: string,
    patch: Partial<Subscription>,
    event?: string,
  ) => void;
  reset: () => void;
  startNewExperience: () => Promise<void>;
  signOut: () => void;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, renderState] = useState(guestState);
  const currentState = useRef(state);
  // Save before navigation so an immediate reload cannot lose the last action.
  const setState: Dispatch<SetStateAction<PrototypeState>> = useCallback(
    (action) => {
      const next = withIndependentSubscriptions(withFakeCustomer(withFakePayments(withFakeAddresses(
        typeof action === "function" ? action(currentState.current) : action,
      ))));
      currentState.current = next;
      try {
        localStorage.setItem("covabra-prototype-v1", JSON.stringify(next));
      } catch {
        // Keep the demonstration usable when browser storage is unavailable.
      }
      renderState(next);
    },
    [],
  );
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    let mounted = true;
    // Hydrate after the initial render so server and browser markup match.
    queueMicrotask(() => {
      if (!mounted) return;
      try {
        const saved = localStorage.getItem("covabra-prototype-v1");
        if (saved) {
          const parsed: PrototypeState = JSON.parse(saved);
          if (
            parsed.cart &&
            parsed.draft &&
            parsed.subscriptions &&
            parsed.payments &&
            parsed.addresses
          )
            setState(parsed);
        }
      } catch {
        localStorage.removeItem("covabra-prototype-v1");
      }
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [setState]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const updateSubscription = (
    id: string,
    patch: Partial<Subscription>,
    event?: string,
  ) =>
    setState((s) => ({
      ...s,
      subscriptions: s.subscriptions.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              ...(sub.cycleDeliveries && patch.date && !patch.cycleDeliveries
                ? {
                    cycleDeliveries: Object.fromEntries(
                      Object.entries(sub.cycleDeliveries).map(
                        ([frequency, delivery]) => [
                          frequency,
                          {
                            date: addDays(
                              delivery.date,
                              Math.round(
                                (Date.parse(patch.date! + "T12:00:00Z") -
                                  Date.parse(sub.date + "T12:00:00Z")) /
                                  86400000,
                              ),
                            ),
                            period: patch.period ?? delivery.period,
                          },
                        ],
                      ),
                    ),
                  }
                : {}),
              ...patch,
              events: event ? [event, ...sub.events] : sub.events,
            }
          : sub,
      ),
    }));
  return (
    <Context.Provider
      value={{
        state,
        setState,
        ready,
        notify: setToast,
        updateSubscription,
        signOut: () => {
          setState((current) => ({ ...guestState(), cart: current.cart }));
          setToast("Você saiu da sua conta.");
        },
        startNewExperience: async () => {
          // Clear this prototype's origin before saving a clean test session.
          localStorage.clear();
          sessionStorage.clear();
          if ("caches" in window) {
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
              await Promise.race([
                (async () => {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((key) => caches.delete(key)));
                })(),
                new Promise<never>((_, reject) => {
                  timer = setTimeout(() => reject(new Error("Tempo esgotado ao limpar o cache.")), 5000);
                }),
              ]);
            } finally {
              clearTimeout(timer);
            }
          }
          const fresh = guestState();
          // Do not navigate if storage cannot be cleared and replaced reliably.
          localStorage.setItem("covabra-prototype-v1", JSON.stringify(fresh));
          setState(fresh);
          setToast("");
        },
        reset: () => {
          setState(guestState());
          setToast("Dados do protótipo restaurados.");
        },
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
          <button aria-label="Fechar aviso" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider ausente");
  return store;
}
