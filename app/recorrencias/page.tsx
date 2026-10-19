import type { Metadata } from "next";
import Link from "next/link";
import { Repeat2, ShoppingBasket, CalendarDays, SlidersHorizontal, LogIn, Check } from "lucide-react";
import { Breadcrumb } from "@/components/shell";
import { SubscriptionStart } from "@/components/subscription-start";
import { SignedInOnly } from "@/components/customer-identification";
import "./recorrencias.css";

export const metadata: Metadata = {
  title: "Recorrências | Sua rotina mais prática | Covabra",
  description: "Escolha seus produtos, defina a frequência e receba suas compras automaticamente.",
};
const steps = [
  { Icon: LogIn, title: "Faça login", text: "Entre com seu e-mail e senha pelo menu da sua conta." },
  { Icon: ShoppingBasket, title: "Escolha os produtos", text: "Use os itens do carrinho ou escolha no catálogo." },
  { Icon: CalendarDays, title: "Defina sua rotina", text: "Ajuste quantidades, frequências, entrega e cartão." },
  { Icon: SlidersHorizontal, title: "Confirme e gerencie", text: "Revise e confirme. Depois, edite, pule, pause ou cancele." },
];
export default function Recurrences() {
  return (
    <main className="recurrence-landing">
      <div className="recurrence-container">
        <Breadcrumb items={[{ label: "Recorrências" }]} />
        <section className="recurrence-overview" aria-labelledby="recurrence-title">
          <div className="recurrence-intro">
            <span className="recurrence-signature"><Repeat2 size={22} aria-hidden="true" /> RECORRÊNCIAS COVABRA</span>
            <h1 id="recurrence-title">Seus essenciais em dia.<br /><span>Mais tempo para você.</span></h1>
            <p>Escolha os produtos e a frequência. Receba suas compras automaticamente, no ritmo da sua casa.</p>
            <div className="recurrence-actions">
              <SubscriptionStart>Criar minha assinatura</SubscriptionStart>
              <SignedInOnly><Link href="/minhas-assinaturas">Minhas assinaturas</Link></SignedInOnly>
            </div>
            <span className="recurrence-control"><Check size={17} aria-hidden="true" /> Edite, pause ou cancele quando precisar.</span>
          </div>
          <section className="recurrence-guide" aria-labelledby="recurrence-guide-title">
            <h2 id="recurrence-guide-title">Como funciona</h2>
            <ol>
              {steps.map(({ Icon, title, text }, i) => (
                <li key={title}>
                  <span className="recurrence-step-icon" aria-hidden="true"><Icon size={21} /><small>{i + 1}</small></span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </section>
      </div>
    </main>
  );
}
