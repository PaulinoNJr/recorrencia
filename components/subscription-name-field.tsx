"use client";

import { useId } from "react";
import type { SubscriptionItem } from "@/types";
import { MAX_SUBSCRIPTION_NAME_LENGTH, normalizeSubscriptionName, suggestSubscriptionNames } from "@/lib/subscription-name";

export function SubscriptionNameField({ name, items, onChange, compact = false }: {
  name?: string;
  items: SubscriptionItem[];
  onChange: (name: string | undefined) => void;
  compact?: boolean;
}) {
  const id = useId();
  const suggestions = suggestSubscriptionNames(items);
  const value = name ?? suggestions[0];
  return (
    <section className={"panel subscription-name-panel" + (compact ? " subscription-name-compact" : "")} aria-labelledby={id + "-title"}>
      <div className="subscription-name-heading"><h2 id={id + "-title"}>Um nome para sua compra recorrente</h2></div>
      <label htmlFor={id}>Nome da compra recorrente</label>
      <input id={id} type="text" value={value} maxLength={MAX_SUBSCRIPTION_NAME_LENGTH} autoComplete="off" aria-describedby={id + "-help"} onChange={(event) => onChange(event.target.value)} onBlur={() => {
        if (name !== undefined) onChange(normalizeSubscriptionName(name) || undefined);
      }} />
      <div className="subscription-name-help"><p id={id + "-help"}>Escreva um nome que faça sentido para você.</p><span>{Array.from(value).length}/{MAX_SUBSCRIPTION_NAME_LENGTH}</span></div>
      {new Set(items.map((item) => item.frequency)).size > 1 && <p className="subscription-name-cycle-note">Com frequências diferentes, cada recorrência recebe esse nome acompanhado da frequência.</p>}
    </section>
  );
}
