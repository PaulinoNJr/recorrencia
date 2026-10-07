"use client";
import { Trash2, Repeat2, Check } from "lucide-react";
import { products, productById, frequencies } from "@/data/products";
import { SubscriptionItem } from "@/types";
import { money } from "@/lib/utils";
import { Quantity } from "./ui";
export function ProductEditor({
  items,
  onChange,
  defaults = [],
  pendingFrequencyIds = [],
  onFrequencyChange,
  ids = products.filter((p) => p.id !== "substituto").map((p) => p.id),
}: {
  items: SubscriptionItem[];
  onChange: (items: SubscriptionItem[]) => void;
  ids?: string[];
  defaults?: SubscriptionItem[];
  pendingFrequencyIds?: string[];
  onFrequencyChange?: (
    id: string,
    frequency: SubscriptionItem["frequency"],
  ) => void;
}) {
  const change = (id: string, patch: Partial<SubscriptionItem>) =>
    onChange(items.map((i) => (i.productId === id ? { ...i, ...patch } : i)));
  return (
    <div className="product-editor">
      {ids.map((id) => {
        const p = productById(id),
          item = items.find((i) => i.productId === id);
        return (
          <div
            key={id}
            className={
              "subscription-product panel " +
              (item ? "selected" : "") +
              (!p.eligible ? " ineligible" : "")
            }
          >
            <label className="product-checkbox">
              <input
                type="checkbox"
                aria-label={"Incluir " + p.name + " na assinatura"}
                disabled={!p.eligible}
                checked={!!item}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [
                          ...items,
                          {
                            productId: id,
                            quantity:
                              defaults.find((i) => i.productId === id)
                                ?.quantity ?? p.quantity,
                            frequency: p.frequency,
                          },
                        ]
                      : items.filter((i) => i.productId !== id),
                  )
                }
              />
              <span>
                <Check size={13} />
              </span>
            </label>
            <img src={p.image} alt={p.name} />
            <div className="product-info">
              <h3>{p.name}</h3>
              <p>{p.category}</p>
              <small>
                {!p.eligible ? (
                  "Este produto não está disponível para assinatura."
                ) : item ? (
                  <>
                    <Repeat2 size={13} /> Incluído na assinatura
                  </>
                ) : null}
              </small>
            </div>
            <div className="product-controls">
              {item ? (
                <>
                  <label>
                    Quantidade
                    <Quantity
                      value={item.quantity}
                      onChange={(quantity) => change(id, { quantity })}
                    />
                  </label>
                  <label>
                    Receber
                    <select
                      aria-label={"Frequência de " + p.name}
                      value={
                        pendingFrequencyIds.includes(id) ? "" : item.frequency
                      }
                      aria-invalid={
                        pendingFrequencyIds.includes(id) || undefined
                      }
                      onChange={(e) =>
                        onFrequencyChange
                          ? onFrequencyChange(
                              id,
                              e.target.value as SubscriptionItem["frequency"],
                            )
                          : change(id, {
                              frequency: e.target
                                .value as SubscriptionItem["frequency"],
                            })
                      }
                    >
                      {onFrequencyChange && (
                        <option value="" disabled>
                          Escolha a frequência
                        </option>
                      )}
                      {frequencies.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <span className="muted">
                  {p.eligible ? "Selecione para configurar" : "Compra única"}
                </span>
              )}
            </div>
            <div className="product-price">
              <strong>{money(p.price * (item?.quantity || p.quantity))}</strong>
              <small>{money(p.price)} / un.</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function CartItems({
  items,
  onChange,
  showUnitPrice = false,
}: {
  items: SubscriptionItem[];
  onChange: (items: SubscriptionItem[]) => void;
  showUnitPrice?: boolean;
}) {
  return (
    <div className="panel cart-products">
      <div className="cart-table-head">
        <span>Produto</span>
        <span>Quantidade</span>
        <span>Subtotal</span>
      </div>
      {items.map((item) => {
        const p = productById(item.productId);
        return (
          <div className="cart-item" key={p.id}>
            <img src={p.image} alt={p.name} />
            <div className="product-info">
              <h3>{p.name}</h3>
              <p>{p.category}</p>
              <div>
                {p.previousPrice && <del>{money(p.previousPrice)}</del>}{" "}
                <strong>{money(p.price)}</strong>
              </div>
              {p.eligible && (
                <small>
                  <Repeat2 size={13} />
                  Disponível para assinatura
                </small>
              )}
            </div>
            {showUnitPrice && (
              <strong className="cart-unit-price">{money(p.price)}</strong>
            )}
            <Quantity
              value={item.quantity}
              onChange={(quantity) =>
                onChange(
                  items.map((i) =>
                    i.productId === p.id ? { ...i, quantity } : i,
                  ),
                )
              }
            />
            <strong className="cart-price">
              {money(p.price * item.quantity)}
            </strong>
            <button
              className="icon-btn"
              aria-label={"Remover " + p.name}
              onClick={() =>
                onChange(items.filter((i) => i.productId !== p.id))
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
export function ItemList({
  items,
  recurring = true,
}: {
  items: SubscriptionItem[];
  recurring?: boolean;
}) {
  return (
    <div>
      {items.map((i) => {
        const p = productById(i.substituteId || i.productId);
        return (
          <div className="detail-product" key={i.productId}>
            <img src={p.image} alt={p.name} />
            <div>
              <h3>{p.name}</h3>
              <p>
                {i.quantity} {i.quantity === 1 ? "unidade" : "unidades"}{" "}
                {recurring && (
                  <>
                    <span>·</span> {i.frequency}
                  </>
                )}
              </p>
              {i.skipOnce && (
                <small className="warning-text">
                  Removido apenas da próxima entrega
                </small>
              )}
              {i.substituteId && (
                <small>Substitui {productById(i.productId).name}</small>
              )}
            </div>
            <strong>{money(i.quantity * p.price)}</strong>
          </div>
        );
      })}
    </div>
  );
}
