"use client";

import { useState } from "react";
import { frequencies } from "@/data/products";
import { Frequency, SubscriptionItem } from "@/types";

export function SubscriptionFrequency({ items, pendingIds, onApply }: {
  items: SubscriptionItem[];
  pendingIds: string[];
  onApply: (ids: string[], frequency: Frequency) => void;
}) {
  const [frequency, setFrequency] = useState<Frequency | "">("");
  const pendingCount = items.filter((item) => pendingIds.includes(item.productId)).length;

  return (
    <section className="panel frequency-bulk" aria-labelledby="bulk-frequency-title">
      <h2 id="bulk-frequency-title">Uma frequência para todos?</h2>
      <p>Escolha uma frequência para os produtos incluídos. Depois, ajuste cada produto individualmente, se preferir.</p>
      <div className="frequency-bulk-controls">
        <label htmlFor="bulk-frequency">Frequência para todos
          <select id="bulk-frequency" value={frequency} disabled={!items.length} onChange={(event) => setFrequency(event.target.value as Frequency)}>
            <option value="" disabled>Escolha a frequência</option>
            {frequencies.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <button type="button" className="btn secondary" disabled={!frequency || !items.length} onClick={() => { if (frequency && items.length) onApply(items.map((item) => item.productId), frequency); }}>
          Aplicar frequência a todos
        </button>
      </div>
      <p className="frequency-progress" role="status">{!items.length ? "Inclua produtos para usar esta opção." : pendingCount ? `${pendingCount} ${pendingCount === 1 ? "produto ainda precisa" : "produtos ainda precisam"} de uma frequência.` : "Todos os produtos estão com a frequência definida."}</p>
    </section>
  );
}
