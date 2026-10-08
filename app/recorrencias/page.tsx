import type { Metadata } from "next";
import Link from "next/link";
import {
  Repeat2,
  ShoppingBasket,
  CalendarDays,
  SlidersHorizontal,
  Pause,
  Check,
  ChevronDown,
} from "lucide-react";
import { Breadcrumb } from "@/components/shell";
import "./recorrencias.css";
import { SubscriptionStart } from "@/components/subscription-start";
export const metadata: Metadata = {
  title: "Recorrências | Sua rotina mais prática | Covabra",
  description:
    "Entenda como receber seus produtos essenciais automaticamente. Escolha os itens, defina a frequência e mantenha tudo sob seu controle.",
};
const steps = [
  {
    Icon: ShoppingBasket,
    title: "Escolha seus Produtos",
    text: "Clique em “Criar minha assinatura”. Use os produtos do seu carrinho atual ou busque seus essenciais no catálogo.",
  },
  {
    Icon: CalendarDays,
    title: "Combine com sua rotina",
    text: "Defina a quantidade e a frequência de cada item. Depois, escolha a primeira entrega, o endereço e o cartão.",
  },
  {
    Icon: SlidersHorizontal,
    title: "Confirme. E controle tudo.",
    text: "Revise e confirme sua assinatura. Em Minhas Assinaturas, você pode editar produtos, pular uma entrega, pausar ou cancelar.",
  },
];
export default function Recurrences() {
  return (
    <main className="recurrence-landing">
      <div className="recurrence-container">
        <Breadcrumb items={[{ label: "Recorrências" }]} />
        <section
          className="recurrence-identity"
          aria-labelledby="recurrence-title"
        >
          <div className="recurrence-identity-copy">
            <span className="recurrence-identity-label">
              SUA COMPRA RECORRENTE
            </span>
            <div className="recurrence-brand">
              <span className="recurrence-brand-symbol" aria-hidden="true">
                <Repeat2 />
              </span>
              <h1 id="recurrence-title">
                Recorrências <span>Covabra</span>
              </h1>
            </div>
            <h2>Sua rotina merece essa facilidade.</h2>
            <p>
              Escolha seus produtos e a frequência. Receba suas compras
              automaticamente e ajuste sua assinatura quando precisar.
            </p>
          </div>
          <div className="recurrence-identity-art" aria-hidden="true">
            <div className="recurrence-calendar">
              <CalendarDays />
              <Repeat2 />
            </div>
            <span className="recurrence-rhythm weekly">Toda semana</span>
            <span className="recurrence-rhythm fortnightly">
              A cada 15 dias
            </span>
            <span className="recurrence-rhythm monthly">Todo mês</span>
            <span className="recurrence-art-note">No ritmo da sua casa.</span>
          </div>
        </section>
        <nav
          className="recurrence-shortcuts"
          aria-label="Explore as recorrências Covabra"
        >
          <a href="#como-funciona">
            <span className="recurrence-shortcut-icon green">
              <Repeat2 />
            </span>
            <strong>Como funciona</strong>
          </a>
          <a href="#monte-sua-assinatura">
            <span className="recurrence-shortcut-icon blue">
              <ShoppingBasket />
            </span>
            <strong>Monte sua assinatura</strong>
          </a>
          <Link href="/minhas-assinaturas">
            <span className="recurrence-shortcut-icon yellow">
              <SlidersHorizontal />
            </span>
            <strong>Minhas assinaturas</strong>
          </Link>
        </nav>
        <section id="como-funciona" className="recurrence-steps">
          <div className="recurrence-section-heading">
            <div className="eyebrow">SIMPLES, DO COMEÇO AO FIM</div>
            <h2>Sua assinatura em 3 passos</h2>
            <p>
              Comece pelo carrinho ou pelo catálogo. A recorrência é uma escolha
              sua.
            </p>
          </div>
          <div className="recurrence-step-grid">
            {steps.map(({ Icon, title, text }, i) => (
              <article key={title}>
                <div className="recurrence-step-top">
                  <span>0{i + 1}</span>
                  <Icon size={26} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="recurrence-menu-tip">
            <SlidersHorizontal size={17} />
            Para gerenciar, abra o menu de <strong>Robson</strong>, escolha{" "}
            <strong>Recorrências</strong> e acesse sua assinatura.
          </p>
        </section>
        <section id="monte-sua-assinatura" className="recurrence-hero">
          <div className="recurrence-hero-copy">
            <div className="eyebrow">
              <Repeat2 size={16} />
              RECORRÊNCIAS COVABRA
            </div>
            <h2>
              Seus essenciais em dia.
              <br />
              <em>Mais tempo para você.</em>
            </h2>
            <p>
              Leite, café e os produtos que fazem parte da sua vida. Com uma
              assinatura, eles chegam automaticamente, no ritmo que você
              escolher.
            </p>
            <SubscriptionStart>Quero criar minha assinatura</SubscriptionStart>
            <a className="recurrence-how-link" href="#como-funciona">
              Veja como funciona
              <ChevronDown size={16} />
            </a>
            <span className="recurrence-reassurance">
              <Check size={15} />
              Você escolhe os produtos. Você controla a rotina.
            </span>
          </div>
          <div
            className="recurrence-visual"
            aria-label="Exemplo: leite toda semana, café todo mês e papel higiênico a cada 15 dias"
          >
            <div className="recurrence-orbit" />
            <div className="recurrence-visual-heading">
              <Repeat2 size={20} />
              <span>Uma rotina que se renova</span>
            </div>
            <div className="recurrence-example milk">
              <img
                src="/products/leite.jpg"
                alt="Leite integral"
                width="86"
                height="125"
              />
              <span>
                Leite integral<strong>Toda semana</strong>
              </span>
              <Check size={17} />
            </div>
            <div className="recurrence-example coffee">
              <img
                src="/products/cafe.svg"
                alt="Café torrado"
                width="86"
                height="125"
              />
              <span>
                Café do dia a dia<strong>Todo mês</strong>
              </span>
              <Check size={17} />
            </div>
            <div className="recurrence-example paper">
              <img
                src="/products/papel.svg"
                alt="Papel higiênico"
                width="86"
                height="105"
              />
              <span>
                Papel higiênico<strong>A cada 15 dias</strong>
              </span>
              <Check size={17} />
            </div>
            <div className="recurrence-delivery-note">
              <CalendarDays size={18} />
              <span>Cada produto, no seu tempo.</span>
            </div>
          </div>
        </section>
        <div className="recurrence-benefits">
          <span>
            <Repeat2 size={19} />
            Sem refazer a mesma compra
          </span>
          <span>
            <CalendarDays size={19} />
            Frequências do seu jeito
          </span>
          <span>
            <Pause size={19} />
            Pause quando precisar
          </span>
        </div>
      </div>
    </main>
  );
}
