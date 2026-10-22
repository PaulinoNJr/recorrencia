"use client";

import { Minus, Plus, Repeat2 } from "lucide-react";
import { Product } from "@/types";
import { useStore } from "./store";

export function SubscriptionProductControl({ product }: { product: Product }) {
  const { state, setState, ready, notify } = useStore();
  const quantity = state.draft.items.find((item) => item.productId === product.id)?.quantity ?? 0;

  function changeQuantity(delta: number) {
    setState((current) => {
      const draft = current.draft;
      const item = draft.items.find((entry) => entry.productId === product.id);
      const nextQuantity = Math.max(0, Math.min(99, (item?.quantity ?? 0) + delta));
      const pending = draft.frequencyPending ?? draft.items.map((entry) => entry.productId);
      return {
        ...current,
        draft: {
          ...draft,
          discoveredProductIds: [...new Set([...(draft.discoveredProductIds ?? []), product.id])],
          removedProductIds: draft.removedProductIds?.filter((id) => id !== product.id),
          frequencyPending: nextQuantity === 0
            ? pending.filter((id) => id !== product.id)
            : item ? pending : [...new Set([...pending, product.id])],
          items: nextQuantity === 0
            ? draft.items.filter((entry) => entry.productId !== product.id)
            : item
              ? draft.items.map((entry) => entry.productId === product.id ? { ...entry, quantity: nextQuantity } : entry)
              : [...draft.items, { productId: product.id, quantity: nextQuantity, frequency: product.frequency }],
        },
      };
    });
    if (!quantity && delta > 0) notify(product.name + " adicionado à recorrência.");
    if (quantity === 1 && delta < 0) notify(product.name + " removido da recorrência.");
  }

  return (
    <div className="product-cart-control">
      {quantity === 0 ? (
        <button type="button" className="btn product-cart-add" disabled={!ready} onClick={() => changeQuantity(1)}>
          <Repeat2 size={17} /> Eu quero!
        </button>
      ) : (
        <div className="product-cart-quantity" role="group" aria-label={"Quantidade de " + product.name + " na recorrência"}>
          <button type="button" disabled={!ready} aria-label={"Diminuir quantidade de " + product.name} onClick={() => changeQuantity(-1)}>
            <Minus size={18} />
          </button>
          <output aria-live="polite" aria-label={"Quantidade de " + product.name}>{quantity}</output>
          <button type="button" disabled={!ready || quantity >= 99} aria-label={"Aumentar quantidade de " + product.name} onClick={() => changeQuantity(1)}>
            <Plus size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
