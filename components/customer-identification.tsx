"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useStore } from "./store";
import { PrototypeState } from "@/types";

type Customer = NonNullable<PrototypeState["customer"]>;

export function SignedInOnly({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  return ready && state.customer ? <>{children}</> : null;
}

export function CustomerForm({ onComplete, submitLabel = "Continuar" }: { onComplete: () => void; submitLabel?: string }) {
  const { state, setState } = useStore();
  const [data, setData] = useState<Customer>(() => ({
    firstName: state.purchase?.firstName ?? state.customer?.firstName ?? "",
    lastName: state.purchase?.lastName ?? state.customer?.lastName ?? "",
    email: state.purchase?.email ?? state.customer?.email ?? "",
    phone: state.purchase?.phone ?? state.customer?.phone ?? "",
    cpf: state.purchase?.cpf ?? state.customer?.cpf ?? "",
  }));
  const [error, setError] = useState("");
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      const customer = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()])) as Customer;
      if (Object.values(customer).some((value) => !value)) {
        setError("Preencha todos os dados para continuar.");
        return;
      }
      setState((current) => ({ ...current, customer, purchase: { ...current.purchase, ...customer } }));
      onComplete();
    }}>
      <div className="checkout-form-grid">
        {([
          ["email", "E-mail", "email", "email"],
          ["firstName", "Nome", "text", "given-name"],
          ["lastName", "Sobrenome", "text", "family-name"],
          ["cpf", "CPF", "text", "off"],
          ["phone", "Telefone", "tel", "tel"],
        ] as const).map(([key, label, type, autoComplete]) => (
          <label className="checkout-field" key={key}>
            {label}
            <input required type={type} autoComplete={autoComplete} value={data[key]}
              inputMode={key === "cpf" ? "numeric" : undefined}
              pattern={key === "cpf" ? "[0-9.\\-]{11,14}" : undefined}
              onChange={(event) => {
                const value = event.target.value;
                setData((previous) => ({ ...previous, [key]: value }));
                setState((current) => ({ ...current, purchase: { ...current.purchase, [key]: value } }));
              }} />
          </label>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <button className="btn primary checkout-full-button" type="submit">{submitLabel}</button>
    </form>
  );
}

export function Identification({ next = "/loja", title = "Identifique-se para continuar" }: { next?: string; title?: string }) {
  const { state, ready } = useStore();
  const router = useRouter();
  if (!ready) return <main className="container loading">Carregando…</main>;
  return (
    <main className="checkout-width checkout-main checkout-email-page">
      <h1 className="checkout-page-title">{title}</h1>
      <section className="checkout-box">
        <h2>Seus dados</h2>
        <p>Use dados fictícios para avaliar este protótipo.</p>
        <CustomerForm onComplete={() => router.replace(next)} />
        {!state.customer && <p>Já tem conta? <Link className="text-action" href={`/entrar?next=${encodeURIComponent(next)}`}>Entrar</Link></p>}
      </section>
    </main>
  );
}

export function CustomerGate({ children, requireDetails = false }: { children: React.ReactNode; requireDetails?: boolean }) {
  const { state, ready } = useStore();
  const path = usePathname();
  if (!ready) return <main className="container loading">Carregando…</main>;
  if (state.customer && (!requireDetails || Object.values(state.customer).every((value) => value.trim()))) return <>{children}</>;
  return (
    <main className="checkout-width checkout-main checkout-email-page">
      <h1 className="checkout-page-title">Identifique-se para continuar</h1>
      <section className="checkout-box">
        <h2>Seus dados</h2>
        <p>Use dados fictícios para avaliar este protótipo.</p>
        <CustomerForm onComplete={() => {}} />
        {!state.customer && <p>Já tem conta? <Link className="text-action" href={`/entrar?next=${encodeURIComponent(path)}`}>Entrar</Link></p>}
      </section>
    </main>
  );
}
