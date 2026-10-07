"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Repeat2,
  CalendarDays,
  Package,
  Heart,
} from "lucide-react";
import { useStore } from "./store";
import { Breadcrumb } from "./shell";
import {
  Button,
  CheckoutStepper,
  PageHeading,
  Summary,
  EmptyState,
  Modal,
} from "./ui";
import { ProductEditor, ItemList } from "./products";
import { AddressChoices, PaymentChoices, DeliveryOptions } from "./choices";
import { dateLabel, money, total, longDate } from "@/lib/utils";
import { products, productById } from "@/data/products";
export function Checkout({ step }: { step: number }) {
  const { state, setState, ready } = useStore();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const draft = state.draft;
  const pendingFrequencyIds = draft.frequencyPending ?? draft.items.map((item) => item.productId);
  const hasMissingFrequency = draft.items.some((item) =>
    pendingFrequencyIds.includes(item.productId),
  );
  const fromCatalog = draft.source === "catalog";
  const catalogIds = products
    .filter(
      (p) =>
        p.id !== "substituto" &&
        p.eligible &&
        `${p.name} ${p.category}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .map((p) => p.id);
  const patch = (change: Partial<typeof draft>) =>
    setState((s) => ({ ...s, draft: { ...s.draft, ...change } }));
  const address = state.addresses.find((a) => a.id === draft.addressId);
  const payment = state.payments.find((p) => p.id === draft.paymentId);
  if (!ready)
    return (
      <main className="container loading" aria-busy="true">
        Carregando sua assinatura…
      </main>
    );
  if (step > 0 && !draft.items.length)
    return (
      <main className="container">
        <EmptyState
          title="Vamos escolher seus produtos?"
          description="Inclua pelo menos um produto para continuar sua assinatura."
        />
        <Link className="btn secondary" href="/assinatura/configurar">
          Escolher produtos
        </Link>
      </main>
    );
  if (step > 0 && hasMissingFrequency)
    return (
      <main className="container">
        <h1>Escolha a frequência dos produtos</h1>
        <p>
          Defina a frequência de cada item selecionado ou remova-o da assinatura
          para continuar.
        </p>
        <Link className="btn primary" href="/assinatura/configurar">
          Voltar aos produtos
        </Link>
      </main>
    );
  const titles = [
    "Monte sua assinatura",
    "Quando e onde você quer receber?",
    "Pagamento da assinatura",
    "Revise sua assinatura",
  ];
  const descriptions = [
    "Escolha o que deseja receber automaticamente e com qual frequência.",
    "Sua rotina, seu endereço, seu melhor horário.",
    "Escolha o cartão para os próximos recebimentos.",
    "Confira os detalhes. Está tudo do seu jeito?",
  ];
  const confirm = () => {
    if (!agreed || submitting || hasMissingFrequency) return;
    setSubmitting(true);
    const id = String(
      Math.max(126, ...state.subscriptions.map((s) => Number(s.id))) + 1,
    ).padStart(5, "0");
    setState((s) => ({
      ...s,
      lastCreated: id,
      subscriptions: [
        {
          ...s.draft,
          id,
          name: "Minha nova assinatura",
          status: "Ativa",
          events: ["Assinatura criada em 06/10/2026"],
          history: [],
        },
        ...s.subscriptions,
      ],
    }));
    router.push("/assinatura/sucesso");
  };
  return (
    <main className="container">
      <Breadcrumb
        items={[
          { label: "Meu carrinho", href: "/carrinho" },
          { label: "Criar assinatura" },
        ]}
      />
      <CheckoutStepper active={step} />
      <PageHeading
        title={titles[step]}
        description={descriptions[step]}
        eyebrow="COMPRAS QUE ACOMPANHAM SUA ROTINA"
      />
      <div className="content-grid">
        <div>
          {step === 0 && (
            <>
              <div className="notice">
                <Repeat2 size={20} />
                <span>
                  Você está no controle. Cada produto pode ter uma frequência
                  diferente.
                  <br />
                  {!fromCatalog && (
                    <strong>
                      Os itens não selecionados continuam como compra única no
                      carrinho.
                    </strong>
                  )}
                </span>
              </div>
              {fromCatalog && (
                <div className="subscription-catalog-search">
                  <label htmlFor="subscription-search">
                    Buscar no catálogo de produtos
                  </label>
                  <input
                    id="subscription-search"
                    type="search"
                    placeholder="Busque por produto ou categoria"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <p>
                    {catalogIds.length} produtos encontrados ·{" "}
                    {draft.items.length} selecionados para assinatura
                  </p>
                </div>
              )}
              <ProductEditor
                defaults={fromCatalog ? [] : state.cart}
                ids={
                  fromCatalog
                    ? catalogIds
                    : state.cart
                        .filter((i) => productById(i.productId).eligible)
                        .map((i) => i.productId)
                }
                items={draft.items}
                pendingFrequencyIds={pendingFrequencyIds}
                onFrequencyChange={(id, frequency) =>
                  patch({
                    items: draft.items.map((item) =>
                      item.productId === id ? { ...item, frequency } : item,
                    ),
                    frequencyPending: pendingFrequencyIds.filter(
                      (pendingId) => pendingId !== id,
                    ),
                  })
                }
                onChange={(items) =>
                  patch({
                    items,
                    frequencyPending: items
                      .filter(
                        (item) =>
                          pendingFrequencyIds.includes(item.productId) ||
                          !draft.items.some(
                            (current) => current.productId === item.productId,
                          ),
                      )
                      .map((item) => item.productId),
                  })
                }
              />
              {fromCatalog && !catalogIds.length && (
                <div className="panel empty">
                  <h2>Nenhum produto encontrado</h2>
                  <p>Tente outro nome ou categoria.</p>
                  <Button variant="secondary" onClick={() => setSearch("")}>
                    Ver todos os produtos
                  </Button>
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <section className="panel section-panel">
                <h2>
                  <CalendarDays size={22} />
                  Endereço de entrega
                </h2>
                <AddressChoices
                  value={draft.addressId}
                  onChange={(addressId) => patch({ addressId })}
                />
              </section>
              <section className="panel section-panel">
                <h2>Combine com a sua rotina</h2>
                <DeliveryOptions
                  date={draft.date}
                  period={draft.period}
                  onChange={patch}
                />
                <div className="notice">
                  <Info size={19} />
                  <span>
                    Depois da primeira entrega, cada produto seguirá a
                    frequência escolhida.
                  </span>
                </div>
              </section>
            </>
          )}
          {step === 2 && (
            <section className="panel section-panel">
              <h2>Seus cartões</h2>
              <PaymentChoices
                value={draft.paymentId}
                onChange={(paymentId) => patch({ paymentId })}
              />
              <div className="notice">
                <Info size={19} />
                <span>
                  As cobranças serão realizadas automaticamente antes de cada
                  ciclo.
                </span>
              </div>
              <p className="muted">
                Você poderá alterar seu cartão posteriormente em Minhas
                Assinaturas.
              </p>
            </section>
          )}
          {step === 3 && (
            <>
              <section className="panel section-panel">
                <div className="section-title">
                  <h2>
                    Produtos <small>({draft.items.length})</small>
                  </h2>
                  <Link href="/assinatura/configurar">Editar</Link>
                </div>
                <ItemList items={draft.items} />
              </section>
              <div className="review-grid">
                <section className="panel section-panel">
                  <div className="section-title">
                    <h2>Entrega</h2>
                    <Link href="/assinatura/entrega">Editar</Link>
                  </div>
                  <strong>{address?.label}</strong>
                  <p>
                    {address?.street}
                    <br />
                    {address?.city} · {address?.zip}
                  </p>
                  <strong>{longDate(draft.date)}</strong>
                  <p>{draft.period}</p>
                </section>
                <section className="panel section-panel">
                  <div className="section-title">
                    <h2>Pagamento</h2>
                    <Link href="/assinatura/pagamento">Editar</Link>
                  </div>
                  <strong>
                    {payment?.brand} •••• {payment?.last4}
                  </strong>
                  <p>
                    {payment?.holder}
                    <br />
                    Validade {payment?.expiry}
                  </p>
                  <p className="muted">
                    Cobrança automática antes de cada ciclo.
                  </p>
                </section>
              </div>
              <section className="panel section-panel">
                <div className="section-title">
                  <h2>Próximo ciclo</h2>
                  <Link href="/assinatura/entrega">Editar</Link>
                </div>
                <p>
                  Primeira entrega: <strong>{dateLabel(draft.date)}</strong> ·{" "}
                  {draft.period}
                </p>
                <p>
                  Valor estimado do primeiro ciclo:{" "}
                  <strong>{money(total(draft.items) + 9.9)}</strong>
                </p>
                <div className="notice">
                  <Info size={19} />O valor de cada ciclo poderá variar conforme
                  preços e disponibilidade dos produtos.
                </div>
              </section>
              <label className="terms">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                Li e concordo com os{" "}
                <button onClick={() => setTerms(true)}>
                  termos da assinatura
                </button>
                .
              </label>
            </>
          )}
        </div>
        <Summary items={draft.items} date={draft.date}>
          {hasMissingFrequency && (
            <p className="frequency-required-message" role="status">
              Escolha a frequência de cada produto selecionado ou remova o item
              da assinatura para continuar.
            </p>
          )}
          <Button
            disabled={
              !draft.items.length ||
              hasMissingFrequency ||
              !draft.date ||
              (step === 3 && !agreed) ||
              submitting
            }
            onClick={() =>
              step === 3
                ? confirm()
                : router.push(
                    "/assinatura/" + ["entrega", "pagamento", "revisao"][step],
                  )
            }
          >
            {submitting
              ? "Criando assinatura…"
              : [
                  "Continuar para entrega",
                  "Continuar para pagamento",
                  "Revisar assinatura",
                  "Confirmar assinatura",
                ][step]}
            <ArrowRight size={17} />
          </Button>
          <Link
            className="back-link"
            href={
              step === 0
                ? "/carrinho"
                : "/assinatura/" +
                  ["configurar", "entrega", "pagamento"][step - 1]
            }
          >
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </Summary>
      </div>
      {terms && (
        <Modal title="Termos da assinatura" onClose={() => setTerms(false)}>
          <p>
            A assinatura agenda os produtos selecionados nas frequências
            escolhidas. O preço e a disponibilidade podem variar a cada ciclo,
            com aviso para revisão.
          </p>
          <p>
            Você pode editar, pular uma entrega, pausar ou cancelar em Minhas
            Assinaturas. Produtos removidos deste ciclo permanecem nos ciclos
            seguintes.
          </p>
          <p>Esta demonstração não realiza cobranças ou entregas reais.</p>
          <Button
            onClick={() => {
              setAgreed(true);
              setTerms(false);
            }}
          >
            Li e concordo
          </Button>
        </Modal>
      )}
    </main>
  );
}
export function Success() {
  const { state, ready } = useStore();
  const sub = state.subscriptions.find((s) => s.id === state.lastCreated);
  if (!ready) return <main className="container loading">Carregando…</main>;
  if (!sub)
    return (
      <main className="container">
        <EmptyState
          title="Sua próxima rotina começa aqui"
          description="Crie uma assinatura a partir do carrinho."
        />
      </main>
    );
  return (
    <main className="container success-page">
      <div className="success-icon">
        <Check size={38} />
      </div>
      <div className="eyebrow">MAIS TEMPO PARA O QUE IMPORTA</div>
      <h1>Sua assinatura foi criada!</h1>
      <p>Agora suas compras essenciais chegam até você automaticamente.</p>
      <section className="panel success-card">
        <div className="section-title">
          <h2>Assinatura #{sub.id}</h2>
          <span className="badge active">Ativa</span>
        </div>
        <div className="success-stats">
          <div>
            <CalendarDays />
            <span>Próxima entrega</span>
            <strong>{dateLabel(sub.date)}</strong>
          </div>
          <div>
            <Repeat2 />
            <span>Valor estimado</span>
            <strong>{money(total(sub.items) + 9.9)}</strong>
          </div>
          <div>
            <Package />
            <span>Produtos</span>
            <strong>{sub.items.length}</strong>
          </div>
        </div>
        <div className="notice">
          <Heart size={19} />
          Tudo sob seu controle. Edite, pause ou cancele quando precisar.
        </div>
        <Link className="btn primary" href={"/minhas-assinaturas/" + sub.id}>
          Ver minha assinatura <ArrowRight size={17} />
        </Link>
        <Link className="back-link" href="/comprar">
          Continuar comprando
        </Link>
      </section>
    </main>
  );
}
