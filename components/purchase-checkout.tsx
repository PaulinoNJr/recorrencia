"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "./store";
import { AddressChoices, DeliveryOptions, PaymentChoices } from "./choices";
import { ItemList } from "./products";
import { money, total, dateLabel } from "@/lib/utils";
import { Check } from "lucide-react";
export function PurchaseCheckout({ step }: { step: string }) {
  const { state, setState, ready } = useStore();
  const router = useRouter();
  const data = state.purchase || {};
  const patch = (change: Partial<typeof data>) =>
    setState((s) => ({ ...s, purchase: { ...s.purchase, ...change } }));
  const addressId = data.addressId || state.addresses[0]?.id;
  const paymentId = data.paymentId || state.payments[0]?.id;
  const date = data.date || state.draft.date;
  const period = data.period || state.draft.period;
  if (!ready)
    return (
      <main className="checkout-width checkout-main loading">
        Carregando compra…
      </main>
    );
  if (!state.cart.length)
    return (
      <main className="checkout-width checkout-main">
        <h1>Seu carrinho está vazio.</h1>
        <Link className="btn primary" href="/comprar">
          Escolher produtos
        </Link>
      </main>
    );
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
        <Link className="btn primary" href="/">
          Continuar comprando
        </Link>
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push("/checkout/entrega");
                }}
              >
                <div className="checkout-form-grid">
                  <label className="checkout-field">
                    E-mail
                    <input
                      required
                      type="email"
                      value={data.email || ""}
                      onChange={(e) => patch({ email: e.target.value })}
                    />
                  </label>
                  <label className="checkout-field">
                    Nome
                    <input
                      required
                      autoComplete="given-name"
                      value={data.firstName || ""}
                      onChange={(e) => patch({ firstName: e.target.value })}
                    />
                  </label>
                  <label className="checkout-field">
                    Sobrenome
                    <input
                      required
                      autoComplete="family-name"
                      value={data.lastName || ""}
                      onChange={(e) => patch({ lastName: e.target.value })}
                    />
                  </label>
                  <label className="checkout-field">
                    CPF
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9.\-]{11,14}"
                      value={data.cpf || ""}
                      onChange={(e) => patch({ cpf: e.target.value })}
                    />
                  </label>
                  <label className="checkout-field">
                    Telefone
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={data.phone || ""}
                      onChange={(e) => patch({ phone: e.target.value })}
                    />
                  </label>
                </div>
                <button className="btn primary checkout-full-button">
                  Ir para entrega
                </button>
              </form>
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
              disabled={!paymentId}
              onClick={() => {
                patch({ paymentId });
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
