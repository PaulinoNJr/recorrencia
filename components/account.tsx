"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Repeat2,
  ArrowRight,
  CalendarDays,
  Package,
  Plus,
  ChevronRight,
  AlertTriangle,
  Pause,
  SkipForward,
  CreditCard,
  MapPin,
  History,
  Check,
  Truck,
  Settings2,
} from "lucide-react";
import { useStore } from "./store";
import { Breadcrumb } from "./shell";
import { Badge, Button, EmptyState, Modal, PageHeading, Summary } from "./ui";
import { ItemList, ProductEditor } from "./products";
import { AddressChoices, DeliveryOptions, PaymentChoices } from "./choices";
import { dateLabel, money, total, addDays, nextCycle } from "@/lib/utils";
import { productById } from "@/data/products";
import { SubscriptionItem } from "@/types";
export function SubscriptionList() {
  const { state, ready } = useStore();
  const [filter, setFilter] = useState("Todas");
  const visible = state.subscriptions.filter(
    (s) =>
      filter === "Todas" ||
      s.status ===
        (
          {
            Ativas: "Ativa",
            Pausadas: "Pausada",
            Canceladas: "Cancelada",
          } as Record<string, string>
        )[filter],
  );
  return (
    <main className="container">
      <Breadcrumb
        items={[{ label: "Minha conta" }, { label: "Minhas assinaturas" }]}
      />
      <PageHeading
        title="Minhas assinaturas"
        description="Os essenciais da sua casa, sempre no seu tempo."
        action={
          <Link className="btn primary" href="/carrinho">
            <Plus size={17} />
            Nova assinatura
          </Link>
        }
      />
      <div className="account-banner">
        <div className="banner-icon">
          <Repeat2 size={30} />
        </div>
        <div>
          <h2>Menos lembretes. Mais tempo para você.</h2>
          <p>
            Acompanhe suas entregas e ajuste suas compras conforme a vida
            acontece.
          </p>
        </div>
        <span>
          <CalendarDays size={44} />
        </span>
      </div>
      <div className="tabs" role="tablist" aria-label="Filtrar assinaturas">
        {["Todas", "Ativas", "Pausadas", "Canceladas"].map((f) => (
          <button
            role="tab"
            aria-selected={f === filter}
            className={f === filter ? "selected" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}{" "}
            <span>
              {f === "Todas"
                ? state.subscriptions.length
                : state.subscriptions.filter(
                    (s) =>
                      s.status ===
                      (
                        {
                          Ativas: "Ativa",
                          Pausadas: "Pausada",
                          Canceladas: "Cancelada",
                        } as Record<string, string>
                      )[f],
                  ).length}
            </span>
          </button>
        ))}
      </div>
      {!ready ? (
        <div className="loading">Carregando suas assinaturas…</div>
      ) : visible.length ? (
        <div className="subscription-grid">
          {visible.map((s) => (
            <article className="panel subscription-card" key={s.id}>
              <div className="section-title">
                <span className="subscription-number">ASSINATURA #{s.id}</span>
                <Badge status={s.status} />
              </div>
              <h2>{s.name}</h2>
              <div className="product-thumbnails">
                {s.items.slice(0, 4).map((i) => (
                  <img
                    key={i.productId}
                    src={productById(i.substituteId || i.productId).image}
                    alt={productById(i.productId).name}
                  />
                ))}
                <span>{s.items.length} produtos</span>
              </div>
              {s.status === "Pagamento recusado" && (
                <div className="inline-alert">
                  <AlertTriangle size={15} />
                  Atualize o cartão para continuar recebendo.
                </div>
              )}
              {s.status === "Pausada" && (
                <div className="inline-warning">
                  Pausada até {dateLabel(s.pausedUntil || s.date)}
                </div>
              )}
              <div className="card-stats">
                <div>
                  <span>Próxima entrega</span>
                  <strong>
                    {s.status === "Cancelada" ? "—" : dateLabel(s.date)}
                  </strong>
                </div>
                <div>
                  <span>Valor estimado</span>
                  <strong>{money(total(s.items) + 9.9)}</strong>
                </div>
              </div>
              <Link className="card-link" href={"/minhas-assinaturas/" + s.id}>
                Ver detalhes <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma assinatura por aqui"
          description="Suas assinaturas com este status aparecerão aqui."
        />
      )}
      <p className="account-help">
        <Settings2 size={17} /> Você pode editar, pausar ou cancelar sua
        assinatura quando precisar.
      </p>
    </main>
  );
}
type Action =
  "pause" | "skip" | "cancel" | "payment" | "delivery" | "substitute" | null;
export function SubscriptionDetail({
  id,
  operation = false,
}: {
  id: string;
  operation?: boolean;
}) {
  const { state, ready, updateSubscription, notify } = useStore();
  const s = state.subscriptions.find((s) => s.id === id);
  const [action, setAction] = useState<Action>(null);
  const [pauseDays, setPauseDays] = useState("30");
  const [pauseDate, setPauseDate] = useState("2026-11-05");
  const [payment, setPayment] = useState("");
  const [delivery, setDelivery] = useState({
    addressId: "",
    date: "",
    period: "",
  });
  const [reason, setReason] = useState("");
  if (!ready) return <main className="container loading">Carregando…</main>;
  if (!s)
    return (
      <main className="container">
        <EmptyState
          title="Assinatura não encontrada"
          description="Confira suas assinaturas para continuar."
        />
      </main>
    );
  const address = state.addresses.find((a) => a.id === s.addressId),
    card = state.payments.find((p) => p.id === s.paymentId);
  const skippedDate = nextCycle(s.items, s.date);
  const unavailable = s.items.find(
    (i) =>
      productById(i.productId).stock === 0 && !i.substituteId && !i.skipOnce,
  );
  const locked = s.status === "Cancelada";
  const save = (
    patch: Parameters<typeof updateSubscription>[1],
    message: string,
  ) => {
    updateSubscription(id, patch, message);
    setAction(null);
    notify(message);
  };
  return (
    <main className="container">
      <Breadcrumb
        items={[
          {
            label: operation ? "Operação" : "Minhas assinaturas",
            href: operation ? "/operacao" : "/minhas-assinaturas",
          },
          { label: "Assinatura #" + id },
        ]}
      />
      <PageHeading
        title={"Assinatura #" + id}
        description={s.name}
        action={<Badge status={s.status} />}
      />
      {s.status === "Pagamento recusado" && (
        <div className="notice danger-notice">
          <AlertTriangle />
          <span>
            <strong>Não conseguimos aprovar seu pagamento.</strong>
            <br />
            Atualize o cartão para que sua próxima entrega siga como planejado.
          </span>
          <Button
            variant="secondary"
            onClick={() => {
              setPayment(s.paymentId);
              setAction("payment");
            }}
          >
            Atualizar cartão
          </Button>
        </div>
      )}
      {s.status === "Pausada" && (
        <div className="notice warning-notice">
          <Pause />
          <span>
            Assinatura pausada até {dateLabel(s.pausedUntil || s.date)}. Nenhuma
            nova cobrança será realizada durante a pausa.
          </span>
          <Button
            variant="secondary"
            onClick={() =>
              save(
                { status: "Ativa", pausedUntil: undefined },
                "Assinatura reativada com sucesso.",
              )
            }
          >
            Reativar assinatura
          </Button>
        </div>
      )}
      {s.status === "Cancelada" && (
        <div className="notice">
          Esta assinatura foi cancelada. Não haverá novas cobranças ou entregas.
        </div>
      )}
      <div className="detail-overview">
        <div>
          <CalendarDays />
          <span>
            Próxima entrega
            <strong>
              {locked ? "Sem entregas agendadas" : dateLabel(s.date)}
            </strong>
          </span>
        </div>
        <div>
          <Repeat2 />
          <span>
            Valor estimado<strong>{money(total(s.items) + 9.9)}</strong>
          </span>
        </div>
        <div>
          <Package />
          <span>
            Itens na assinatura<strong>{s.items.length} produtos</strong>
          </span>
        </div>
        <Link href={"/minhas-assinaturas/" + id + "/historico"}>
          <History size={18} />
          Ver histórico
          <ChevronRight size={15} />
        </Link>
      </div>
      <div className="content-grid detail-layout">
        <div>
          <section className="panel section-panel">
            <div className="section-title">
              <h2>Próximo ciclo</h2>
              <span className="muted">
                {locked
                  ? "Cancelado"
                  : s.status === "Pausada"
                    ? "Em pausa"
                    : "Tudo no seu tempo"}
              </span>
            </div>
            <div className="cycle-steps">
              {[
                [Check, "Revisão dos produtos", -5],
                [Settings2, "Período para alterações", -3],
                [CreditCard, "Cobrança", -2],
                [Package, "Separação", -1],
                [Truck, "Entrega", 0],
              ].map(([Icon, label, offset], i) => {
                const I = Icon as typeof Check;
                return (
                  <div
                    key={i}
                    className={i === 1 ? "current" : i === 0 ? "complete" : ""}
                  >
                    <div>
                      <I size={18} />
                    </div>
                    <strong>{String(label)}</strong>
                    <small>{dateLabel(addDays(s.date, Number(offset)))}</small>
                  </div>
                );
              })}
            </div>
            <p className="cycle-note">
              Você pode ajustar seus produtos até{" "}
              {dateLabel(addDays(s.date, -3))}, antes da cobrança.
            </p>
          </section>
          {unavailable && !locked && (
            <div className="availability panel">
              <AlertTriangle size={23} />
              <div>
                <h3>
                  {productById(unavailable.productId).name} está temporariamente
                  indisponível.
                </h3>
                <p>Escolha como prefere seguir nesta entrega.</p>
                <div className="inline-actions">
                  <button
                    onClick={() =>
                      save(
                        {
                          items: s.items.map((i) =>
                            i.productId === unavailable.productId
                              ? { ...i, skipOnce: true }
                              : i,
                          ),
                        },
                        "Produto removido apenas deste ciclo.",
                      )
                    }
                  >
                    Remover deste ciclo
                  </button>
                  <button onClick={() => setAction("substitute")}>
                    Escolher substituto <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
          <section className="panel section-panel">
            <div className="section-title">
              <h2>Produtos da assinatura</h2>
              {!locked && (
                <Link href={"/minhas-assinaturas/" + id + "/editar"}>
                  Editar produtos
                </Link>
              )}
            </div>
            <ItemList items={s.items} />
            <div className="detail-subtotal">
              <span>Subtotal dos produtos</span>
              <strong>{money(total(s.items))}</strong>
            </div>
          </section>
          <div className="review-grid">
            <section className="panel section-panel">
              <div className="section-title">
                <h2>
                  <MapPin size={18} />
                  Entrega
                </h2>
                {!locked && (
                  <button
                    onClick={() => {
                      setDelivery({
                        addressId: s.addressId,
                        date: s.date,
                        period: s.period,
                      });
                      setAction("delivery");
                    }}
                  >
                    Alterar
                  </button>
                )}
              </div>
              <strong>{address?.label}</strong>
              <p>
                {address?.street}
                <br />
                {address?.city} · {address?.zip}
              </p>
              <p>{s.period}</p>
            </section>
            <section className="panel section-panel">
              <div className="section-title">
                <h2>
                  <CreditCard size={18} />
                  Pagamento
                </h2>
                {!locked && (
                  <button
                    onClick={() => {
                      setPayment(s.paymentId);
                      setAction("payment");
                    }}
                  >
                    Alterar
                  </button>
                )}
              </div>
              <strong>
                {card?.brand} •••• {card?.last4}
              </strong>
              <p>
                {card?.holder}
                <br />
                Validade {card?.expiry}
              </p>
              <p className="muted">Cobrança automática a cada ciclo.</p>
            </section>
          </div>
          {operation && (
            <section className="panel section-panel">
              <h2>Cliente e eventos</h2>
              <p>Robson Ferreira · robson@example.com</p>
              {s.events.map((event, i) => (
                <p key={i}>• {event}</p>
              ))}
              <h3>Últimas cobranças</h3>
              {s.history.map((c) => (
                <p key={c.id}>
                  {dateLabel(c.date)} · {c.status} · {money(c.amount)}
                </p>
              ))}
            </section>
          )}
        </div>
        <aside className="panel management">
          <h2>Sua assinatura, seu jeito</h2>
          <p>Ajuste sempre que sua rotina mudar.</p>
          {!locked && (
            <>
              <Link href={"/minhas-assinaturas/" + id + "/editar"}>
                <Package size={18} />
                Editar produtos
                <ChevronRight size={15} />
              </Link>
              <Link href={"/minhas-assinaturas/" + id + "/editar"}>
                <Repeat2 size={18} />
                Alterar frequência
                <ChevronRight size={15} />
              </Link>
              <button
                onClick={() => {
                  setDelivery({
                    addressId: s.addressId,
                    date: s.date,
                    period: s.period,
                  });
                  setAction("delivery");
                }}
              >
                <Truck size={18} />
                Alterar entrega
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => {
                  setPayment(s.paymentId);
                  setAction("payment");
                }}
              >
                <CreditCard size={18} />
                Alterar pagamento
                <ChevronRight size={15} />
              </button>
              <hr />
              <button
                disabled={s.status === "Pausada"}
                onClick={() => setAction("skip")}
              >
                <SkipForward size={18} />
                Pular próxima entrega
              </button>
              <button
                disabled={s.status === "Pausada"}
                onClick={() => setAction("pause")}
              >
                <Pause size={18} />
                Pausar assinatura
              </button>
              <button
                className="cancel-action"
                onClick={() => setAction("cancel")}
              >
                Cancelar assinatura
              </button>
            </>
          )}
          <div className="notice">
            <Repeat2 size={20} />
            Controle total, sem complicação.
          </div>
        </aside>
      </div>
      {action && (
        <Modal
          title={
            {
              pause: "Pausar sua assinatura?",
              skip: "Pular próxima entrega?",
              cancel: "Cancelar assinatura?",
              payment: "Alterar pagamento",
              delivery: "Alterar entrega",
              substitute: "Um substituto para seu café",
            }[action]
          }
          onClose={() => setAction(null)}
        >
          {action === "pause" && (
            <>
              <p>Durante a pausa, nenhuma nova cobrança será realizada.</p>
              <div className="period-grid pause-grid">
                {["15", "30", "60", "date"].map((d) => (
                  <button
                    className={"period " + (pauseDays === d ? "chosen" : "")}
                    key={d}
                    onClick={() => setPauseDays(d)}
                  >
                    {d === "date" ? "Escolher data" : d + " dias"}
                  </button>
                ))}
              </div>
              {pauseDays === "date" && (
                <label>
                  Retomar em
                  <input
                    aria-label="Data de retomada"
                    type="date"
                    min="2026-10-07"
                    value={pauseDate}
                    onChange={(e) => setPauseDate(e.target.value)}
                  />
                </label>
              )}
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setAction(null)}>
                  Cancelar
                </Button>
                <Button
                  disabled={pauseDays === "date" && pauseDate < "2026-10-07"}
                  onClick={() => {
                    const date =
                      pauseDays === "date"
                        ? pauseDate
                        : addDays("2026-10-06", Number(pauseDays));
                    save(
                      {
                        status: "Pausada",
                        pausedUntil: date,
                        date: s.date < date ? date : s.date,
                      },
                      "Assinatura pausada até " + dateLabel(date) + ".",
                    );
                  }}
                >
                  Confirmar pausa
                </Button>
              </div>
            </>
          )}
          {action === "skip" && (
            <>
              <p>
                Esta entrega será pulada, sem cobrança. Os itens retomam suas
                frequências a partir da próxima data prevista.
              </p>
              <div className="skip-dates">
                <div>
                  Entrega atual<strong>{dateLabel(s.date)}</strong>
                </div>
                <ArrowRight />
                <div>
                  Após pular<strong>{dateLabel(skippedDate)}</strong>
                </div>
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setAction(null)}>
                  Voltar
                </Button>
                <Button
                  onClick={() =>
                    save(
                      {
                        date: skippedDate,
                        items: s.items.map((i) => ({ ...i, skipOnce: false })),
                      },
                      "Próxima entrega pulada com sucesso.",
                    )
                  }
                >
                  Pular esta entrega
                </Button>
              </div>
            </>
          )}
          {action === "cancel" && (
            <>
              <p>
                Você deixará de receber os produtos desta assinatura. Não haverá
                novas cobranças.
              </p>
              <label>
                Quer nos contar o motivo? (opcional)
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Selecione, se desejar</option>
                  {[
                    "Preço",
                    "Não preciso mais",
                    "Problema com produtos",
                    "Problema com entrega",
                    "Outro",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setAction(null)}>
                  Manter assinatura
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    save(
                      { status: "Cancelada" },
                      "Assinatura cancelada." +
                        (reason ? " Motivo: " + reason : ""),
                    )
                  }
                >
                  Confirmar cancelamento
                </Button>
              </div>
            </>
          )}
          {action === "payment" && (
            <>
              <PaymentChoices value={payment} onChange={setPayment} />
              <Button
                onClick={() =>
                  save(
                    {
                      paymentId: payment,
                      status:
                        s.status === "Pagamento recusado" ? "Ativa" : s.status,
                    },
                    "Forma de pagamento atualizada com sucesso.",
                  )
                }
              >
                Salvar pagamento
              </Button>
            </>
          )}
          {action === "delivery" && (
            <>
              <AddressChoices
                value={delivery.addressId}
                onChange={(addressId) =>
                  setDelivery((d) => ({ ...d, addressId }))
                }
              />
              <DeliveryOptions
                date={delivery.date}
                period={delivery.period}
                onChange={(patch) => setDelivery((d) => ({ ...d, ...patch }))}
              />
              <Button
                disabled={!delivery.date}
                onClick={() =>
                  save(delivery, "Entrega atualizada com sucesso.")
                }
              >
                Salvar entrega
              </Button>
            </>
          )}
          {action === "substitute" && (
            <>
              <p>Uma sugestão para manter seu café do dia a dia.</p>
              <div className="substitute-comparison">
                <div>
                  <img src="/products/cafe.svg" alt="Café original" />
                  <strong>Café torrado e moído</strong>
                  <small>Indisponível</small>
                </div>
                <ArrowRight />
                <div>
                  <img src="/products/cafe.svg" alt="Café substituto" />
                  <strong>Café seleção tradicional</strong>
                  <small>{money(26.9)} / un.</small>
                </div>
              </div>
              <p>
                Mesma quantidade e frequência. O valor do ciclo será
                recalculado.
              </p>
              <Button
                onClick={() =>
                  save(
                    {
                      items: s.items.map((i) =>
                        i.productId === "cafe"
                          ? { ...i, substituteId: "substituto" }
                          : i,
                      ),
                    },
                    "Substituto escolhido com sucesso.",
                  )
                }
              >
                Confirmar substituição
              </Button>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
export function EditSubscription({ id }: { id: string }) {
  const { state, ready, updateSubscription, notify } = useStore();
  const router = useRouter();
  const sub = state.subscriptions.find((s) => s.id === id);
  const [local, setLocal] = useState<SubscriptionItem[] | null>(null);
  const items = local ?? sub?.items ?? [];
  if (!ready) return <main className="container loading">Carregando…</main>;
  if (!sub || sub.status === "Cancelada")
    return (
      <main className="container">
        <EmptyState
          title="Assinatura indisponível para edição"
          description="Confira suas assinaturas para continuar."
        />
      </main>
    );
  const changed = JSON.stringify(items) !== JSON.stringify(sub.items);
  return (
    <main className="container">
      <Breadcrumb
        items={[
          { label: "Minhas assinaturas", href: "/minhas-assinaturas" },
          { label: "Assinatura #" + id, href: "/minhas-assinaturas/" + id },
          { label: "Editar produtos" },
        ]}
      />
      <PageHeading
        title="Do seu jeito, a cada entrega"
        description="Adicione ou remova produtos e ajuste quantidades e frequências."
      />
      <div className="content-grid">
        <ProductEditor items={items} onChange={setLocal} />
        <Summary items={items} date={sub.date}>
          <div className="notice">
            {changed
              ? "Você tem alterações para salvar."
              : "Nenhuma alteração até agora."}
            <br />
            {sub.items.length} → {items.length} produtos
            <br />
            {money(total(sub.items))} → {money(total(items))}
          </div>
          <Button
            disabled={!items.length || !changed}
            onClick={() => {
              updateSubscription(
                id,
                { items },
                "Produtos e frequências atualizados.",
              );
              notify("Assinatura atualizada com sucesso.");
              router.push("/minhas-assinaturas/" + id);
            }}
          >
            Salvar alterações
          </Button>
          <Link className="back-link" href={"/minhas-assinaturas/" + id}>
            Voltar sem salvar
          </Link>
        </Summary>
      </div>
    </main>
  );
}
export function SubscriptionHistory({ id }: { id: string }) {
  const { state, ready } = useStore();
  const sub = state.subscriptions.find((s) => s.id === id);
  const [cycle, setCycle] = useState<string | null>(null);
  if (!ready) return <main className="container loading">Carregando…</main>;
  if (!sub)
    return (
      <main className="container">
        <EmptyState
          title="Assinatura não encontrada"
          description="Volte para Minhas Assinaturas."
        />
      </main>
    );
  const selected = sub.history.find((c) => c.id === cycle);
  return (
    <main className="container narrow">
      <Breadcrumb
        items={[
          { label: "Minhas assinaturas", href: "/minhas-assinaturas" },
          { label: "Assinatura #" + id, href: "/minhas-assinaturas/" + id },
          { label: "Histórico" },
        ]}
      />
      <PageHeading
        title="Uma história de praticidade"
        description={"Histórico da assinatura #" + id}
      />
      <section className="panel section-panel">
        <h2>Entregas e pagamentos</h2>
        {sub.history.length ? (
          <div className="history-timeline">
            {sub.history.map((c) => (
              <button key={c.id} onClick={() => setCycle(c.id)}>
                <span className="timeline-dot">
                  <Check size={16} />
                </span>
                <div>
                  <small>{dateLabel(c.date)}</small>
                  <h3>{c.status}</h3>
                  <p>Ciclo da assinatura #{id}</p>
                </div>
                <strong>{money(c.amount)}</strong>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <p>
            A primeira entrega ainda não aconteceu. Os ciclos concluídos
            aparecerão aqui.
          </p>
        )}
      </section>
      <section className="panel section-panel">
        <h2>Atividade da assinatura</h2>
        {sub.events.map((event, i) => (
          <p key={i} className="event-row">
            <Repeat2 size={16} />
            {event}
          </p>
        ))}
      </section>
      <Link className="btn secondary" href={"/minhas-assinaturas/" + id}>
        Voltar para assinatura
      </Link>
      {selected && (
        <Modal
          title={"Detalhes do ciclo · " + dateLabel(selected.date)}
          onClose={() => setCycle(null)}
        >
          <p>
            Status: <strong>{selected.status}</strong>
          </p>
          <p>
            Valor registrado: <strong>{money(selected.amount)}</strong>
          </p>
          <p>Assinatura #{id} · Pagamento com cartão salvo.</p>
          <div className="notice">
            Registro histórico de demonstração. Alterações atuais nos produtos
            não modificam os valores deste ciclo.
          </div>
          <Button onClick={() => setCycle(null)}>Fechar detalhes</Button>
        </Modal>
      )}
    </main>
  );
}
