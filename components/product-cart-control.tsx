"use client";

import { Minus, Plus } from "lucide-react";
import { Product } from "@/types";
import { useStore } from "./store";

export function ProductCartControl({ product }: { product: Product }) {
  const { state, setState, ready, notify } = useStore();
  const quantity =
    state.cart.find((item) => item.productId === product.id)?.quantity || 0;

  function changeQuantity(delta: number) {
    setState((current) => {
      const item = current.cart.find((entry) => entry.productId === product.id);
      const nextQuantity = Math.max(
        0,
        Math.min(99, (item?.quantity || 0) + delta),
      );
      return {
        ...current,
        cart:
          nextQuantity === 0
            ? current.cart.filter((entry) => entry.productId !== product.id)
            : item
              ? current.cart.map((entry) =>
                  entry.productId === product.id
                    ? { ...entry, quantity: nextQuantity }
                    : entry,
                )
              : [
                  ...current.cart,
                  {
                    productId: product.id,
                    quantity: nextQuantity,
                    frequency: product.frequency,
                  },
                ],
      };
    });
    if (!quantity) notify(product.name + " adicionado ao carrinho.");
    if (quantity === 1 && delta < 0)
      notify(product.name + " removido do carrinho.");
  }

  return (
    <div className="product-cart-control">
      {quantity === 0 ? (
        <button
          type="button"
          className="btn primary"
          disabled={!ready}
          onClick={() => changeQuantity(1)}
        >
          <Plus size={17} /> Adicionar
        </button>
      ) : (
        <div
          className="product-cart-quantity"
          role="group"
          aria-label={"Quantidade de " + product.name + " no carrinho"}
        >
          <button
            type="button"
            disabled={!ready}
            aria-label={"Diminuir quantidade de " + product.name}
            onClick={() => changeQuantity(-1)}
          >
            <Minus size={18} />
          </button>
          <output
            aria-live="polite"
            aria-label={"Quantidade de " + product.name}
          >
            {quantity}
          </output>
          <button
            type="button"
            disabled={!ready || quantity >= 99}
            aria-label={"Aumentar quantidade de " + product.name}
            onClick={() => changeQuantity(1)}
          >
            <Plus size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
