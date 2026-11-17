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
import { SubscriptionDiscovery, SubscriptionRecommendations } from "./subscription-discovery";
import { SubscriptionFrequency } from "./subscription-frequency";
import { SubscriptionNameField } from "./subscription-name-field";
import { cycleSubscriptionName, resolveSubscriptionName } from "@/lib/subscription-name";
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
  const { state, setState, ready, notify } = useStore();
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
  const draftName = resolveSubscriptionName(draft.name, draft.items);
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
  const invoiceCpf = state.customer?.cpf || draft.cpf || "";
  const hasInvalidInvoice = draft.invoice === "Sim" && !/^\d{11}$/.test(invoiceCpf.replace(/\D/g, ""));
  const fromCatalog = draft.source !== "cart" && draft.source !== "purchase";
  const fromPurchase = draft.source === "purchase";
  const todayItems = fromPurchase ? state.purchase?.completedItems ?? [] : state.cart;
  const availableProductIds = [...new Set([
    ...(draft.discoveredProductIds ?? []),
    ...draft.items.map((item) => item.productId),
  ])];
  const catalogIds = products
    .filter(
      (p) =>
        p.id !== "substituto" &&
        p.eligible &&
        `${p.name} ${p.category}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")),
    )
    .map((p) => p.id);
  const patch = (change: Partial<typeof draft>) =>
    setState((s) => ({ ...s, draft: { ...s.draft, ...change } }));
  const applyFrequency = (ids: string[], frequency: Frequency) => {
    setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        items: current.draft.items.map((item) => ids.includes(item.productId) ? { ...item, frequency } : item),
        frequencyPending: (current.draft.frequencyPending ?? current.draft.items.map((item) => item.productId)).filter((id) => !ids.includes(id)),
        cycleDeliveries: undefined,
      },
    }));
    notify(ids.length === 1 ? "Frequência do produto atualizada." : `Frequência aplicada a ${ids.length} produtos.`);
  };
  const address = state.addresses.find((a) => a.id === draft.addressId);
  const payment = state.payments.find((p) => p.id === draft.paymentId);
  if (!ready)
    return (
      <main className="container loading" aria-busy="true">
        Carregando sua compra recorrente…
      </main>
    );
  if ((step > 0) && !draft.items.length)
    return (
      <main className="container">
        <EmptyState
          title="Vamos escolher seus produtos?"
          description="Inclua pelo menos um produto para continuar sua compra recorrente."
        />
        <Link className="btn secondary" href="/assinatura/configurar">
          Escolher produtos
        </Link>
      </main>
    );
  if ((step > 0) && hasInvalidQuantity)
    return (
      <main className="container">
        <h1>Defina a quantidade dos produtos</h1>
        <p>Escolha pelo menos 1 unidade de cada produto selecionado ou remova-o da compra recorrente.</p>
        <Link className="btn primary" href="/assinatura/configurar">Voltar aos produtos</Link>
      </main>
    );
  if ((step > 0) && hasInvalidInvoice)
    return (
      <main className="container">
        <h1>Informe o CPF para a nota</h1>
        <p>Preencha os 11 dígitos do CPF ou selecione Não para continuar sem CPF na nota.</p>
        <Link className="btn primary" href="/assinatura/configurar">Voltar aos produtos</Link>
      </main>
    );
  if (step > 0 && hasMissingFrequency)
    return (
      <main className="container">
        <h1>Escolha a frequência dos produtos</h1>
        <p>
          Defina a frequência de cada item selecionado ou remova-o da compra recorrente
          para continuar.
        </p>
        <Link className="btn primary" href="/assinatura/configurar">
          Escolher frequências
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
  if ((step > 1 && !address) || (step > 2 && !payment))
    return (
      <main className="container">
        <h1>{!address ? "Adicione um endereço de entrega" : "Adicione um cartão de teste"}</h1>
        <p>Complete esta etapa antes de revisar sua compra recorrente.</p>
        <Link className="btn primary" href={!address ? "/assinatura/entrega" : "/assinatura/pagamento"}>
          {!address ? "Voltar à entrega" : "Voltar ao pagamento"}
        </Link>
      </main>
    );
  const titles = [
    "Monte sua compra recorrente",
    "Quando e onde você quer receber?",
    "Pagamento da compra recorrente",
    "Revise sua compra recorrente",
  ];
  const descriptions = [
    "Escolha os produtos e ajuste a quantidade e a frequência de cada um. Depois, continue para a entrega.",
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
      hasInvalidInvoice ||
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
          cpf: s.draft.invoice === "Sim" ? s.customer?.cpf || s.draft.cpf : undefined,
          items: cycle.items,
          date: cycle.date,
          period: cycle.period,
          cycleDeliveries: { [cycle.frequency]: { date: cycle.date, period: cycle.period } },
          id: String(Number(id) + index).padStart(5, "0"),
          originId: id,
          name: cycleSubscriptionName(resolveSubscriptionName(s.draft.name, s.draft.items), cycle.frequency, cycles.length > 1),
          status: "Ativa" as const,
          events: [`Compra recorrente “${cycleSubscriptionName(resolveSubscriptionName(s.draft.name, s.draft.items), cycle.frequency, cycles.length > 1)}” criada em ${dateLabel(saoPauloToday())}`],
          history: [],
        })),
        ...s.subscriptions,
      ],
    }));
    notify(cycles.length === 1 ? `“${draftName}” criada com sucesso.` : `${cycles.length} compras recorrentes de “${draftName}” criadas com sucesso.`);
    router.push("/assinatura/sucesso");
  };
  return (
    <main className={`container${step === 0 ? " subscription-config" : step === 3 ? " subscription-review" : step === 1 ? " subscription-delivery" : ""}`}>
      <Breadcrumb
        items={[
          fromCatalog ? { label: "Compra recorrente", href: "/recorrencias" } : { label: "Meu carrinho", href: "/carrinho" },
          { label: "Criar compra recorrente" },
        ]}
      />
      <CheckoutStepper active={step} />
      <PageHeading
        title={titles[step]}
        description={descriptions[step]}
        eyebrow="COMPRAS QUE ACOMPANHAM SUA ROTINA"
      />
      <div className="content-grid">
        <div className={step === 0 ? "subscription-config-sections" : undefined}>
          {step === 0 && (
            <>
              <SubscriptionNameField name={draft.name} items={draft.items} onChange={(name) => patch({ name })} />
              <section className="checkout-box" aria-labelledby="recurring-substitution-title">
                <h2 id="recurring-substitution-title">1. Substituir itens indisponíveis?</h2>
                <p>As substituições serão realizadas apenas se houver itens semelhantes disponíveis.</p>
                <div className="checkout-radio-grid">
                  {[
                    "Reembolso do valor",
                    "Substituir por produto similar de valor igual ou inferior",
                  ].map((label) => (
                    <label key={label}>
                      <input
                        type="radio"
                        name="recurring-substitution"
                        checked={draft.substitute === label}
                        onChange={() => patch({ substitute: label })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>
              <section className="subscription-config-products" aria-labelledby="recurring-products-title">
                <h2 id="recurring-products-title" className="section-title">2. Produtos e frequência</h2>
                <div className="notice">
                  <Repeat2 size={20} />
                  <span>
                    Quantidade e frequência ficam juntas em cada produto.
                    Para agilizar, aplique uma frequência a todos e ajuste as exceções abaixo.
                    <br />
                    {!fromCatalog && !fromPurchase && (
                      <strong>
                        Sua compra de hoje permanece completa no carrinho,
                        inclusive os produtos selecionados para a próxima recorrência.
                      </strong>
                    )}
                  </span>
                </div>
                <SubscriptionDiscovery search={search} onSearch={setSearch} />
                <SubscriptionFrequency
                  items={draft.items}
                  pendingIds={pendingFrequencyIds}
                  onApply={applyFrequency}
                />
                <ProductEditor
                  ids={
                    (fromCatalog
                      ? search.trim()
                        ? catalogIds
                        : availableProductIds
                      : availableProductIds
                          .filter((id) => !fromPurchase || productById(id).eligible))
                      .filter((id) => !draft.removedProductIds?.includes(id))
                  }
                  allowAllProducts={!fromCatalog && !fromPurchase}
                  items={draft.items}
                  onRemove={(id) => {
                    setState((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        items: current.draft.items.filter((item) => item.productId !== id),
                        frequencyPending: (current.draft.frequencyPending ?? current.draft.items.map((item) => item.productId)).filter((pendingId) => pendingId !== id),
                        removedProductIds: [...new Set([...(current.draft.removedProductIds ?? []), id])],
                      },
                    }));
                    notify(productById(id).name + " removido da lista.");
                  }}
                  pendingFrequencyIds={pendingFrequencyIds}
                  onFrequencyChange={(id, frequency) => applyFrequency([id], frequency)}
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
              </section>
              <section className="checkout-box" aria-labelledby="recurring-invoice-title">
                <h2 id="recurring-invoice-title">3. Deseja CPF na nota</h2>
                <p>Se escolher Sim, informe o CPF que deve constar na nota.</p>
                <div className="checkout-radio-grid">
                  {(["Sim", "Não"] as const).map((label) => (
                    <label key={label}>
                      <input
                        type="radio"
                        name="recurring-invoice"
                        checked={draft.invoice === label}
                        onChange={() => patch({ invoice: label, cpf: label === "Sim" ? invoiceCpf : undefined })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {draft.invoice === "Sim" && (
                  <label className="checkout-field">
                    CPF
                    <input
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={invoiceCpf}
                      readOnly={!!state.customer}
                      required
                      aria-invalid={hasInvalidInvoice || undefined}
                      onChange={(event) => patch({ cpf: event.target.value })}
                    />
                  </label>
                )}
              </section>
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
                compras recorrentes.
              </p>
            </section>
          )}
          {step === 3 && (
            <>
              <SubscriptionNameField name={draft.name} items={draft.items} onChange={(name) => patch({ name })} />
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
                  termos da compra recorrente
                </button>
                .</span>
              </label>
            </>
          )}
        </div>
        <div className="subscription-state-summaries">
          <section className="panel purchase-today" aria-labelledby="purchase-today-title">
            <div className="purchase-state-label">{fromPurchase ? "Compra concluída" : "Carrinho atual"}</div>
            <h2 id="purchase-today-title">Sua compra de hoje</h2>
            <p>{fromPurchase ? "Os produtos e quantidades da compra concluída estão preservados." : "Os produtos e quantidades do seu carrinho estão preservados."}</p>
            {todayItems.length ? (
              <details className="purchase-today-items">
                <summary>
                  <span>Ver {todayItems.length} {todayItems.length === 1 ? "produto" : "produtos"}</span>
                  <strong>{money(total(todayItems))}</strong>
                </summary>
                <ItemList items={todayItems} recurring={false} />
              </details>
            ) : <p>Seu carrinho de hoje está vazio.</p>}
            <Link className="text-action" href={fromPurchase ? "/checkout/sucesso" : "/carrinho"}>
              {fromPurchase ? "Ver compra concluída" : "Ver compra de hoje"}
            </Link>
          </section>
          <Summary
            title="Sua próxima recorrência"
            description={draftName}
            items={step > 0 ? nextCycles.flatMap((cycle) => cycle.items) : draft.items}
            date={step > 0 && hasValidDeliveryDate ? earliestCycle?.date : undefined}
            deliveryCost={Math.max(1, step > 0 ? nextCycles.length : !hasMissingFrequency ? cycles.length : 1) * 9.9}
            totalLabel={
              step > 0 ? "Valor estimado do próximo ciclo" :
                !hasMissingFrequency && cycles.length > 1 ? "Estimativa dos primeiros ciclos" : undefined
            }
          >
            {draft.items.length > 0 && hasMissingFrequency && (
              <p className="frequency-required-message" role="status">
                Escolha a frequência de cada produto selecionado ou remova o item
                da compra recorrente para continuar.
              </p>
            )}
            {hasInvalidQuantity && <p className="frequency-required-message" role="status">Escolha pelo menos 1 unidade de cada produto selecionado ou remova-o da compra recorrente para continuar.</p>}
            {hasInvalidInvoice && <p className="frequency-required-message" role="status">Informe os 11 dígitos do CPF para continuar com CPF na nota.</p>}
            <Button
              disabled={
                !draft.items.length ||
                hasMissingFrequency ||
                hasInvalidQuantity ||
                hasInvalidInvoice ||
                (step > 0 && !hasValidDeliveryDate) ||
                (step >= 1 && !address) ||
                (step >= 2 && !payment) ||
                (step === 3 && !agreed) ||
                submitting
              }
              onClick={() => {
                if (hasInvalidQuantity || hasInvalidInvoice) return;
                if (hasMissingFrequency) return;
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
                ? "Criando compra recorrente…"
                : [
                    "Continuar para entrega",
                    "Continuar para pagamento",
                    "Revisar compra recorrente",
                    "Confirmar compra recorrente",
                  ][step]}
              <ArrowRight size={17} />
            </Button>
            <Link
              className="back-link"
              href={
                step === 0
                  ? fromCatalog ? "/recorrencias" : "/carrinho"
                  : "/assinatura/" +
                    ["configurar", "entrega", "pagamento"][step - 1]
              }
            >
              <ArrowLeft size={15} />
              Voltar
            </Link>
          </Summary>
        </div>
      </div>
      {step === 0 && <SubscriptionRecommendations />}
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
        <Modal title="Termos da compra recorrente" onClose={() => setTerms(false)}>
          <p>
            A compra recorrente agenda os produtos selecionados nas frequências
            escolhidas. O preço e a disponibilidade podem variar a cada ciclo,
            com aviso para revisão.
          </p>
          <p>
            Você pode editar, pular uma entrega, pausar ou cancelar em Minhas
            compras recorrentes. Produtos removidos deste ciclo permanecem nos ciclos
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
          description="Crie uma compra recorrente a partir do carrinho."
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
      <h1>{created.length > 1 ? "Suas compras recorrentes foram criadas!" : "Sua compra recorrente foi criada!"}</h1>
      <p>Agora suas compras essenciais chegam até você automaticamente.</p>
      <section className="panel success-card">
        <div className="section-title">
          <h2>Compra recorrente #{sub.id}</h2>
          <span className="badge active">Ativa</span>
        </div>
        <p className="subscription-display-name">{sub.name}</p>
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
              <h3>Compra recorrente #{cycle.subscriptionId} · {cycle.frequency}</h3>
              <p className="subscription-display-name">{created.find((subscription) => subscription.id === cycle.subscriptionId)?.name}</p>
              <p>Primeira entrega: <strong>{dateLabel(cycle.date)}</strong> · {cycle.period}</p>
              <ItemList items={cycle.items} recurring={false} />
              <div className="summary-row"><span>Subtotal dos produtos</span><strong>{money(total(cycle.items))}</strong></div>
              <div className="summary-row"><span>Entrega estimada</span><strong>{money(9.9)}</strong></div>
              <div className="summary-total"><span>Valor estimado deste ciclo<b>{money(total(cycle.items) + 9.9)}</b></span></div>
              <Link className="text-action" href={"/minhas-assinaturas/" + cycle.subscriptionId}>Ver detalhes desta compra recorrente <ArrowRight size={16} /></Link>
            </section>
          ))}
        </div>
        <div className="notice">
          <Heart size={19} />
          Tudo sob seu controle. Edite, pause ou cancele quando precisar.
        </div>
        <Link className="btn primary" href={created.length > 1 ? "/minhas-assinaturas" : "/minhas-assinaturas/" + sub.id}>
          {created.length > 1 ? "Ver minhas compras recorrentes" : "Ver minha compra recorrente"} <ArrowRight size={17} />
        </Link>
        <Link className="back-link" href="/comprar">
          Continuar comprando
        </Link>
      </section>
    </main>
  );
}
