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
import { initialState } from "@/data/subscriptions";
import { PrototypeState, Subscription } from "@/types";
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
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, renderState] = useState(initialState);
  const currentState = useRef(state);
  // Save before navigation so an immediate reload cannot lose the last action.
  const setState: Dispatch<SetStateAction<PrototypeState>> = useCallback(
    (action) => {
      const next =
        typeof action === "function" ? action(currentState.current) : action;
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
        reset: () => {
          setState(initialState());
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
