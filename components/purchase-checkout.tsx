"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "./store";
import { AddressChoices, DeliveryOptions, PaymentChoices } from "./choices";
import { ItemList } from "./products";
import { money, total, dateLabel } from "@/lib/utils";
import { Check, Repeat2, ArrowRight } from "lucide-react";
import { productById } from "@/data/products";
import { CustomerForm } from "./customer-identification";
import { firstDeliveryWindow } from "@/lib/delivery-date";
export function PurchaseCheckout({ step }: { step: string }) {
  const { state, setState, ready } = useStore();
  const router = useRouter();
  const data = state.purchase || {};
  const patch = (change: Partial<typeof data>) =>
    setState((s) => ({ ...s, purchase: { ...s.purchase, ...change } }));
  const addressId = state.addresses.find((address) => address.id === data.addressId)?.id || state.addresses[0]?.id || "";
  const paymentId = state.payments.find((payment) => payment.id === data.paymentId)?.id || state.payments[0]?.id || "";
  const date = data.date || state.draft.date;
  const period = data.period || state.draft.period;
  const purchasedItems = data.completedItems ?? state.cart;
  const recurringItems = purchasedItems.filter(
    (item) => productById(item.productId).eligible,
  );
  const startRecurrence = () => {
    if (!recurringItems.length) return;
    setState((s) => ({
      ...s,
      purchase: {
        ...s.purchase,
        completedItems: purchasedItems.map((item) => ({ ...item })),
      },
      draft: {
        ...s.draft,
        cycleDeliveries: undefined,
        source: "purchase",
        items: recurringItems.map((item) => ({ ...item })),
        frequencyPending: recurringItems.map((item) => item.productId),
        date: firstDeliveryWindow().min,
        period,
        addressId: addressId || s.draft.addressId,
        paymentId: paymentId || s.draft.paymentId,
      },
    }));
    router.push("/assinatura/configurar");
  };
  if (!ready)
    return (
      <main className="checkout-width checkout-main loading">
        Carregando compra…
      </main>
    );
  if (!state.cart.length && !(step === "sucesso" && purchasedItems.length))
    return (
      <main className="checkout-width checkout-main">
        <h1>Seu carrinho está vazio.</h1>
        <Link className="btn primary" href="/comprar">
          Escolher produtos
        </Link>
      </main>
    );
  if (step === "sucesso" && !data.completedItems?.length)
    return <main className="checkout-width checkout-main"><h1>Nenhuma compra concluída</h1><Link className="btn primary" href="/carrinho">Voltar para o carrinho</Link></main>;
  if (step === "sucesso")
    return (
      <main className="checkout-width checkout-main checkout-purchase-success">
        <div className="success-icon">
          <Check />
        </div>
        <h1>Compra realizada!</h1>
        <p>
          Pedido de demonstração #09281 recebido. Nenhuma cobrança real foi
          realizada.
        </p>
        <section
          className="purchase-recurrence-invite"
          aria-labelledby="purchase-recurrence-title"
        >
          <div className="purchase-recurrence-label">
            <Repeat2 size={18} />
            RECORRÊNCIAS COVABRA
          </div>
          <h2 id="purchase-recurrence-title">
            Gostaria de tornar essa compra recorrente?
          </h2>
          <p>
            Use os mesmos produtos e quantidades desta compra. Na próxima tela,
            escolha a frequência de cada item disponível para assinatura.
          </p>
          {!recurringItems.length && (
            <p>Nenhum produto desta compra está disponível para assinatura.</p>
          )}
          <div className="purchase-recurrence-actions">
            <button
              type="button"
              className="btn primary"
              disabled={!recurringItems.length}
              onClick={startRecurrence}
            >
              Sim, tornar recorrente <ArrowRight size={18} />
            </button>
            <Link className="btn secondary" href="/loja">
              Não, continuar comprando
            </Link>
          </div>
        </section>
      </main>
    );
  if (step === "email")
    return (
      <main className="checkout-width checkout-main checkout-email-page">
        <h1 className="checkout-page-title">Finalizar compra</h1>
        <section className="checkout-box">
          <h2>Para finalizar a compra, informe seu e-mail.</h2>
          <p>Rápido. Fácil. Seguro.</p>
          <form
            className="checkout-email-form"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/checkout/dados");
            }}
          >
            <input
              aria-label="E-mail"
              type="email"
              required
              placeholder="seu@email.com"
              value={data.email || ""}
              onChange={(e) => patch({ email: e.target.value })}
            />
            <button className="btn primary">Continuar</button>
          </form>
          <div className="checkout-email-info">
            <strong>Usamos seu e-mail de forma 100% segura para:</strong>
            <ul>
              <li>Identificar seu perfil</li>
              <li>Notificar sobre o andamento do seu pedido</li>
              <li>Gerenciar seu histórico de compras</li>
              <li>Acelerar o preenchimento de suas informações</li>
            </ul>
          </div>
        </section>
      </main>
    );
  return (
    <main className="checkout-width checkout-main">
      <h1 className="checkout-page-title">Finalizar compra</h1>
      <div className="purchase-checkout-grid">
        <div>
          <section className="checkout-box">
            <h2>
              Dados pessoais{" "}
              {step !== "dados" && <Link href="/checkout/dados">Editar</Link>}
            </h2>
            {step === "dados" ? (
              <CustomerForm submitLabel="Ir para entrega" onComplete={() => router.push("/checkout/entrega")} />
            ) : (
              <div className="checkout-saved-info">
                <strong>
                  {data.firstName} {data.lastName}
                </strong>
                <p>{data.email}</p>
                <p>{data.phone}</p>
              </div>
            )}
          </section>
          <section
            className={
              "checkout-box " + (step === "dados" ? "checkout-waiting" : "")
            }
          >
            <h2>
              Entrega{" "}
              {step === "pagamento" && (
                <Link href="/checkout/entrega">Editar</Link>
              )}
            </h2>
            {step === "dados" ? (
              <p>Aguardando o preenchimento dos dados</p>
            ) : step === "entrega" ? (
              <>
                <AddressChoices
                  value={addressId}
                  onChange={(addressId) => patch({ addressId })}
                />
                <DeliveryOptions
                  date={date}
                  period={period}
                  onChange={(change) => patch(change)}
                />
                <button
                  className="btn primary checkout-full-button"
                  disabled={!addressId || !date}
                  onClick={() => {
                    patch({ addressId, date, period });
                    router.push("/checkout/pagamento");
                  }}
                >
                  Ir para pagamento
                </button>
              </>
            ) : (
              <div className="checkout-saved-info">
                <strong>
                  {state.addresses.find((a) => a.id === addressId)?.street}
                </strong>
                <p>
                  {dateLabel(date)} · {period}
                </p>
              </div>
            )}
          </section>
        </div>
        <section
          className={
            "checkout-box purchase-payment " +
            (step !== "pagamento" ? "checkout-waiting" : "")
          }
        >
          <h2>Pagamento</h2>
          {step !== "pagamento" ? (
            <p>Aguardando o preenchimento dos dados</p>
          ) : (
            <>
              <p>Cartão de crédito</p>
              <PaymentChoices
                value={paymentId}
                onChange={(paymentId) => patch({ paymentId })}
              />
              <p className="checkout-payment-note">
                Pagamento de demonstração. Nenhuma cobrança será realizada.
              </p>
            </>
          )}
        </section>
        <aside className="checkout-box purchase-summary">
          <h2>Resumo do pedido</h2>
          <Link className="checkout-back-link" href="/carrinho">
            Voltar para o carrinho
          </Link>
          <ItemList items={state.cart} recurring={false} />
          <div className="checkout-total-row">
            <span>Subtotal</span>
            <span>{money(total(state.cart))}</span>
          </div>
          <div className="checkout-total-row">
            <span>Entrega</span>
            <span>{step === "dados" ? "A calcular" : money(9.9)}</span>
          </div>
          <div className="checkout-total-row total">
            <span>Total</span>
            <span>
              {money(total(state.cart) + (step === "dados" ? 0 : 9.9))}
            </span>
          </div>
          {step === "pagamento" && (
            <button
              className="btn primary checkout-full-button"
              disabled={!state.customer || !addressId || !paymentId || !date || !period}
              onClick={() => {
                if (!state.customer || !addressId || !paymentId || !date || !period) return;
                setState((current) => ({
                  ...current,
                  cart: [],
                  purchase: { ...current.purchase, addressId, paymentId, date, period,
                    completedItems: current.cart.map((item) => ({ ...item })) },
                }));
                router.push("/checkout/sucesso");
              }}
            >
              Confirmar compra
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
