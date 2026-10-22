"use client";

import { useState } from "react";
import { frequencies, productById } from "@/data/products";
import { Frequency, SubscriptionItem } from "@/types";

export function SubscriptionFrequency({ items, pendingIds, onApply }: {
  items: SubscriptionItem[];
  pendingIds: string[];
  onApply: (ids: string[], frequency: Frequency) => void;
}) {
  const [selectedIds, setSelectedIds] = useState(() => items.map((item) => item.productId));
  const [frequency, setFrequency] = useState<Frequency | "">("");
  const allSelected = items.every((item) => selectedIds.includes(item.productId));
  const pendingCount = items.filter((item) => pendingIds.includes(item.productId)).length;

  return (
    <section className="subscription-frequency" aria-label="Frequência dos produtos">
      <div className="panel frequency-bulk">
        <h2>Escolha a frequência em conjunto</h2>
        <p>Todos os produtos começam selecionados. Aplique a mesma frequência a todos ou marque apenas os itens que deseja agrupar.</p>
        <label className="frequency-select-all">
          <input type="checkbox" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.productId) : [])} />
          Selecionar todos os produtos
        </label>
        <div className="frequency-bulk-controls">
          <label htmlFor="bulk-frequency">Receber os produtos selecionados
            <select id="bulk-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}>
              <option value="" disabled>Escolha a frequência</option>
              {frequencies.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <button type="button" className="btn primary" disabled={!frequency || !selectedIds.length} onClick={() => { if (frequency) onApply(selectedIds, frequency); }}>
            Aplicar a {selectedIds.length} {selectedIds.length === 1 ? "produto" : "produtos"}
          </button>
        </div>
        <p className="frequency-progress" role="status">{pendingCount ? `${pendingCount} ${pendingCount === 1 ? "produto ainda precisa" : "produtos ainda precisam"} de uma frequência.` : "Todos os produtos estão com a frequência definida."}</p>
      </div>
      <div className="frequency-items">
        {items.map((item) => {
          const product = productById(item.productId);
          const pending = pendingIds.includes(item.productId);
          return (
            <article className="panel frequency-item" key={item.productId} aria-label={product.name}>
              <label className="frequency-item-check">
                <input type="checkbox" aria-label={`Selecionar ${product.name} para aplicar frequência`} checked={selectedIds.includes(item.productId)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, item.productId] : ids.filter((id) => id !== item.productId))} />
              </label>
              <img src={product.image} alt="" width="48" height="64" />
              <div className="frequency-item-info">
                <h3>{product.name}</h3>
                <p>{item.quantity} {item.quantity === 1 ? "unidade" : "unidades"} por entrega</p>
              </div>
              <label className="frequency-item-select">Receber
                <select aria-label={`Frequência de ${product.name}`} value={pending ? "" : item.frequency} aria-invalid={pending || undefined} onChange={(event) => onApply([item.productId], event.target.value as Frequency)}>
                  <option value="" disabled>Escolha a frequência</option>
                  {frequencies.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </article>
          );
        })}
      </div>
    </section>
  );
}
