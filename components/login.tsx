"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./store";

export function Login({ next = "/loja" }: { next?: string }) {
  const { ready, setState } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (!ready) return <main className="container loading">Carregando…</main>;
  return (
    <main className="checkout-width checkout-main checkout-email-page">
      <h1 className="checkout-page-title">Entrar</h1>
      <section className="checkout-box">
        <h2>Acesse sua conta</h2>
        <p>Para testar, use qualquer e-mail e senha. Não é necessário ter uma conta cadastrada.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim() || !password) return;
          setState((current) => current.customer?.email === email.trim()
            ? {
              ...current,
              customer: { ...current.customer, firstName: "Paulino" },
              purchase: { ...current.purchase, firstName: "Paulino" },
            }
            : {
              ...current,
              customer: { email: email.trim(), firstName: "Paulino", lastName: "", phone: "", cpf: "" },
              addresses: [], payments: [], subscriptions: [], lastCreated: null,
              draft: { ...current.draft, addressId: "", paymentId: "" },
              purchase: { email: email.trim(), firstName: "Paulino", substitute: current.purchase?.substitute, invoice: current.purchase?.invoice },
            });
          // Passwords are used only for the simulated entry and never persisted.
          setPassword("");
          router.replace(next);
        }}>
          <div className="form-fields">
            <label className="checkout-field">E-mail
              <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="checkout-field">Senha
              <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn primary checkout-full-button">Entrar</button>
        </form>
        <p>Não tem conta? <Link className="text-action" href={`/cadastro?next=${encodeURIComponent(next)}`}>Cadastrar-se</Link></p>
      </section>
    </main>
  );
}
