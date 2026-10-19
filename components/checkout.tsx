"use client";
import { useEffect, useState } from "react";
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
import { cycleSchedule } from "@/lib/cycle-schedule";
import { products, productById } from "@/data/products";
import { validSubscriptionDelivery, saoPauloToday } from "@/lib/delivery-date";
import {
  subscriptionCycles,
  subscriptionDraftCycles,
  firstCycle,
  cycleEstimate,
} from "@/lib/subscription-cycles";
import { Frequency } from "@/types";
export function Checkout({ step }: { step: number }) {
  const { state, setState, ready } = useStore();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCycle, setEditingCycle] = useState<{
    frequency: Frequency;
    date: string;
    period: string;
  } | null>(null);
  const [today, setToday] = useState(saoPauloToday);
  useEffect(() => {
    const refresh = () =>
      setToday(saoPauloToday());
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const draft = state.draft;
  const cycles = subscriptionDraftCycles(draft, today);
  const earliestCycle = firstCycle(cycles);
  const nextCycles = cycles.filter((cycle) => cycle.date === earliestCycle?.date);
  const hasValidDeliveryDate = cycles.every((cycle) =>
    validSubscriptionDelivery(cycle.date, today),
  );
  const patchCycle = (
    frequency: Frequency,
    change: { date?: string; period?: string },
  ) =>
    setState((s) => {
      const cycle = subscriptionDraftCycles(s.draft).find((c) => c.frequency === frequency);
      if (!cycle) return s;
      return {
        ...s,
        draft: {
          ...s.draft,
          cycleDeliveries: {
            ...s.draft.cycleDeliveries,
            [frequency]: { date: cycle.date, period: cycle.period, ...change },
          },
        },
      };
    });
  const pendingFrequencyIds =
    draft.frequencyPending ?? draft.items.map((item) => item.productId);
  const hasMissingFrequency = draft.items.some((item) =>
    pendingFrequencyIds.includes(item.productId),
  );
  const hasInvalidQuantity = draft.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1);
  const fromCatalog = draft.source === "catalog";
  const fromPurchase = draft.source === "purchase";
  const availableItems = fromPurchase
    ? (state.purchase?.completedItems ?? state.cart)
    : state.cart;
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
  if (step > 1 && !hasValidDeliveryDate)
    return (
      <main className="container">
        <h1>Escolha a data da primeira entrega</h1>
        <p>A primeira entrega precisa ser em um dos próximos 3 dias.</p>
        <Link className="btn primary" href="/assinatura/entrega">
          Voltar à entrega
        </Link>
      </main>
    );
  if (step > 0 && hasInvalidQuantity)
    return (
      <main className="container">
        <h1>Defina a quantidade dos produtos</h1>
        <p>Escolha pelo menos 1 unidade de cada produto selecionado ou remova-o da assinatura.</p>
        <Link className="btn primary" href="/assinatura/configurar">Voltar aos produtos</Link>
      </main>
    );
  if ((step > 1 && !address) || (step > 2 && !payment))
    return (
      <main className="container">
        <h1>{!address ? "Adicione um endereço de entrega" : "Adicione um cartão de teste"}</h1>
        <p>Complete esta etapa antes de revisar sua assinatura.</p>
        <Link className="btn primary" href={!address ? "/assinatura/entrega" : "/assinatura/pagamento"}>
          {!address ? "Voltar à entrega" : "Voltar ao pagamento"}
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
    if (
      !agreed ||
      submitting ||
      !state.customer || !address || !payment || !draft.items.length ||
      hasMissingFrequency ||
      hasInvalidQuantity ||
      !cycles.every((cycle) => validSubscriptionDelivery(cycle.date))
    )
      return;
    setSubmitting(true);
    const id = String(
      Math.max(126, ...state.subscriptions.map((s) => Number(s.id))) + 1,
    ).padStart(5, "0");
    setState((s) => ({
      ...s,
      lastCreated: id,
      subscriptions: [
        ...cycles.map((cycle, index) => ({
          ...s.draft,
          items: cycle.items,
          date: cycle.date,
          period: cycle.period,
          cycleDeliveries: { [cycle.frequency]: { date: cycle.date, period: cycle.period } },
          id: String(Number(id) + index).padStart(5, "0"),
          originId: id,
          name: "Minha nova assinatura",
          status: "Ativa" as const,
          events: [`Assinatura criada em ${dateLabel(saoPauloToday())}`],
          history: [],
        })),
        ...s.subscriptions,
      ],
    }));
    router.push("/assinatura/sucesso");
  };
  return (
    <main className={`container${step === 3 ? " subscription-review" : step === 1 ? " subscription-delivery" : ""}`}>
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
                  {!fromCatalog && !fromPurchase && (
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
                ids={
                  fromCatalog
                    ? catalogIds
                    : availableItems
                        .filter((i) => !fromPurchase || productById(i.productId).eligible)
                        .map((i) => i.productId)
                }
                allowAllProducts={!fromCatalog && !fromPurchase}
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
                {cycles.map((cycle) => (
                  <div
                    key={cycle.frequency}
                    className="cycle-delivery-group"
                    role="group"
                    aria-label={`Entrega · ${cycle.frequency}`}
                  >
                    <h3>{cycle.frequency}</h3>
                    <ul className="cycle-delivery-products" aria-label={`Produtos · ${cycle.frequency}`}>
                      {cycle.items.map((item) => {
                        const product = productById(item.substituteId || item.productId);
                        return (
                          <li className="cycle-delivery-product" key={item.productId}>
                            <img src={product.image} alt="" width="56" height="64" />
                            <span className="cycle-delivery-product-info">
                              <strong>{product.name}</strong>
                              <small>{product.category}</small>
                            </span>
                            <span className="cycle-delivery-quantity">{item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <DeliveryOptions
                      date={cycle.date}
                      cycleFrequency={cycle.frequency}
                      minDate={today}
                      period={cycle.period}
                      labelPrefix={
                        cycles.length > 1 ? cycle.frequency : undefined
                      }
                      onChange={(change) => patchCycle(cycle.frequency, change)}
                    />
                  </div>
                ))}
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
              {cycles.map((cycle) => (
                <section
                  className="panel section-panel review-cycle"
                  key={cycle.frequency}
                  aria-label={`Ciclo · ${cycle.frequency}`}
                >
                  <div className="section-title">
                    <h2>
                      Próximo ciclo{" "}
                      <small>· {cycle.frequency}</small>
                    </h2>
                    <button
                      type="button"
                      className="text-action"
                      aria-label={`Editar ciclo · ${cycle.frequency}`}
                      onClick={() =>
                        setEditingCycle({
                          frequency: cycle.frequency,
                          date: cycle.date,
                          period: cycle.period,
                        })
                      }
                    >
                      Editar
                    </button>
                  </div>
                  <ul className="cycle-delivery-products" aria-label={`Produtos · ${cycle.frequency}`}>
                    {cycle.items.map((item) => {
                      const product = productById(item.substituteId || item.productId);
                      return (
                        <li className="cycle-delivery-product" key={item.productId}>
                          <img src={product.image} alt="" width="56" height="64" />
                          <span className="cycle-delivery-product-info">
                            <strong>{product.name}</strong>
                            <small>{product.category}</small>
                          </span>
                          <span className="cycle-delivery-quantity">{item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="cycle-schedule">
                    {cycleSchedule(cycle.frequency, cycle.date)}
                  </p>
                  <p className="review-delivery-date">
                    <span>Primeira entrega: <strong>{dateLabel(cycle.date)}</strong></span>
                    <span className="review-delivery-period">{cycle.period}</span>
                  </p>
                  <p>
                    Valor estimado do primeiro ciclo:{" "}
                    <strong>{money(total(cycle.items) + 9.9)}</strong>
                  </p>
                  {cycles.length > 1 && (
                    <p className="muted">
                      Inclui entrega estimada de {money(9.9)} para este ciclo.
                    </p>
                  )}
                  <div className="notice">
                    <Info size={19} />O valor de cada ciclo poderá variar
                    conforme preços e disponibilidade dos produtos.
                  </div>
                </section>
              ))}
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
                  {cycles.map((cycle) => (
                    <p key={cycle.frequency}>
                      <strong>
                        {cycles.length > 1 ? `${cycle.frequency}: ` : ""}
                        {longDate(cycle.date)}
                      </strong>
                      <br />
                      {cycle.period}
                    </p>
                  ))}
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
              <label className="terms">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>Li e concordo com os{" "}
                <button onClick={() => setTerms(true)}>
                  termos da assinatura
                </button>
                .</span>
              </label>
            </>
          )}
        </div>
        <Summary
          items={step > 0 ? nextCycles.flatMap((cycle) => cycle.items) : draft.items}
          date={step > 0 && hasValidDeliveryDate ? earliestCycle?.date : undefined}
          deliveryCost={Math.max(1, step > 0 ? nextCycles.length : cycles.length) * 9.9}
          totalLabel={
            step > 0 ? "Valor estimado do próximo ciclo" :
              cycles.length > 1 ? "Estimativa dos primeiros ciclos" : undefined
          }
        >
          {hasMissingFrequency && (
            <p className="frequency-required-message" role="status">
              Escolha a frequência de cada produto selecionado ou remova o item
              da assinatura para continuar.
            </p>
          )}
          {hasInvalidQuantity && <p className="frequency-required-message" role="status">Escolha pelo menos 1 unidade de cada produto selecionado ou remova-o da assinatura para continuar.</p>}
          <Button
            disabled={
              !draft.items.length ||
              hasMissingFrequency ||
              hasInvalidQuantity ||
              (step > 0 && !hasValidDeliveryDate) ||
              (step >= 1 && !address) ||
              (step >= 2 && !payment) ||
              (step === 3 && !agreed) ||
              submitting
            }
            onClick={() => {
              if (hasInvalidQuantity) return;
              if (
                step > 0 &&
                !cycles.every((cycle) => validSubscriptionDelivery(cycle.date))
              )
                return;
              if (step === 0 || step === 1) {
                patch({
                  date: earliestCycle.date,
                  cycleDeliveries: Object.fromEntries(cycles.map((cycle) => [
                    cycle.frequency, { date: cycle.date, period: cycle.period },
                  ])),
                });
              }
              if (step === 3) confirm();
              else if (step === 0 && !state.customer)
                router.push("/identificacao?next=/assinatura/entrega");
              else
                router.push(
                  "/assinatura/" + ["entrega", "pagamento", "revisao"][step],
                );
            }}
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
      {editingCycle && (
        <Modal
          title={`Configurar ciclo · ${editingCycle.frequency}`}
          onClose={() => setEditingCycle(null)}
        >
          <DeliveryOptions
            date={editingCycle.date}
            period={editingCycle.period}
            minDate={today}
            onChange={(change) =>
              setEditingCycle((current) =>
                current ? { ...current, ...change } : null,
              )
            }
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditingCycle(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!validSubscriptionDelivery(editingCycle.date, today)}
              onClick={() => {
                if (!validSubscriptionDelivery(editingCycle.date)) return;
                patchCycle(editingCycle.frequency, {
                  date: editingCycle.date,
                  period: editingCycle.period,
                });
                setAgreed(false);
                setEditingCycle(null);
              }}
            >
              Salvar ciclo
            </Button>
          </div>
        </Modal>
      )}
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
  const created = sub.originId ? state.subscriptions.filter((subscription) => subscription.originId === sub.originId) : [sub];
  const cycles = created.flatMap((subscription) => subscriptionCycles(subscription.items, subscription.date, subscription.period, subscription.cycleDeliveries).map((cycle) => ({ ...cycle, subscriptionId: subscription.id })));
  return (
    <main className="container success-page">
      <div className="success-icon">
        <Check size={38} />
      </div>
      <div className="eyebrow">MAIS TEMPO PARA O QUE IMPORTA</div>
      <h1>{created.length > 1 ? "Suas assinaturas foram criadas!" : "Sua assinatura foi criada!"}</h1>
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
            <strong>{dateLabel(firstCycle(cycles).date)}</strong>
          </div>
          <div>
            <Repeat2 />
            <span>{cycles.length > 1 ? "Total estimado dos primeiros ciclos" : "Valor estimado do ciclo"}</span>
            <strong>
              {money(cycleEstimate(cycles))}
            </strong>
          </div>
          <div>
            <Package />
            <span>Produtos</span>
            <strong>{created.reduce((count, subscription) => count + subscription.items.length, 0)}</strong>
          </div>
        </div>
        <div className="saved-cycle-list success-cycles">
          {cycles.map((cycle) => (
            <section className="success-cycle" key={cycle.subscriptionId} aria-label={`Resumo do ciclo · ${cycle.frequency}`}>
              <h3>Assinatura #{cycle.subscriptionId} · {cycle.frequency}</h3>
              <p>Primeira entrega: <strong>{dateLabel(cycle.date)}</strong> · {cycle.period}</p>
              <ItemList items={cycle.items} recurring={false} />
              <div className="summary-row"><span>Subtotal dos produtos</span><strong>{money(total(cycle.items))}</strong></div>
              <div className="summary-row"><span>Entrega estimada</span><strong>{money(9.9)}</strong></div>
              <div className="summary-total"><span>Valor estimado deste ciclo<b>{money(total(cycle.items) + 9.9)}</b></span></div>
              <Link className="text-action" href={"/minhas-assinaturas/" + cycle.subscriptionId}>Ver detalhes desta assinatura <ArrowRight size={16} /></Link>
            </section>
          ))}
        </div>
        <div className="notice">
          <Heart size={19} />
          Tudo sob seu controle. Edite, pause ou cancele quando precisar.
        </div>
        <Link className="btn primary" href={created.length > 1 ? "/minhas-assinaturas" : "/minhas-assinaturas/" + sub.id}>
          {created.length > 1 ? "Ver minhas assinaturas" : "Ver minha assinatura"} <ArrowRight size={17} />
        </Link>
        <Link className="back-link" href="/comprar">
          Continuar comprando
        </Link>
      </section>
    </main>
  );
}
