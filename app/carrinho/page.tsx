"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Repeat2,
  ShoppingCart,
  ListPlus,
  Truck,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/components/store";
import { CartItems } from "@/components/products";
import { money, total } from "@/lib/utils";
export default function Cart() {
  const { state, setState, notify, ready } = useStore();
  const router = useRouter();
  const purchase = state.purchase || {};
  const patch = (change: Partial<NonNullable<typeof state.purchase>>) =>
    setState((s) => ({ ...s, purchase: { ...s.purchase, ...change } }));
  const canContinue =
    !!purchase.substitute &&
    !!purchase.invoice &&
    (purchase.invoice !== "Sim" ||
      /^\d{11}$/.test((purchase.cpf || "").replace(/\D/g, "")));
  const subtotal = total(state.cart);
  return (
    <main className="checkout-width checkout-main">
      <h1 className="checkout-page-title">Meu Carrinho</h1>
      <div className="real-cart-grid">
        <div>
          {state.cart.length ? (
            <>
              <section className="checkout-box">
                <h2>1. Substituir itens indisponíveis?</h2>
                <p>
                  As substituições serão realizadas apenas se houver itens
                  semelhantes disponível. Campo obrigatório.
                </p>
                <div className="checkout-radio-grid">
                  {[
                    "Reembolso do valor",
                    "Substituir por produto similar de valor igual ou inferior",
                  ].map((label) => (
                    <label key={label}>
                      <input
                        type="radio"
                        name="substitution"
                        checked={purchase.substitute === label}
                        onChange={() => patch({ substitute: label })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>
              <section className="checkout-box checkout-product-box">
                <h2>2. Lista de produtos</h2>
                <CartItems
                  showUnitPrice
                  items={state.cart}
                  onChange={(cart) => setState((s) => ({ ...s, cart }))}
                />
                <Link className="checkout-more-products" href="/comprar">
                  Escolher mais produtos
                </Link>
              </section>
              <section className="checkout-box">
                <h2>3. Deseja CPF na nota</h2>
                <p>
                  O campo de CPF é obrigatório para continuar com sua compra.
                </p>
                <div className="checkout-radio-grid">
                  {["Sim", "Não"].map((label) => (
                    <label key={label}>
                      <input
                        type="radio"
                        name="invoice"
                        checked={purchase.invoice === label}
                        onChange={() => patch({ invoice: label })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {purchase.invoice === "Sim" && (
                  <label className="checkout-field">
                    CPF
                    <input
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={purchase.cpf || ""}
                      onChange={(e) => patch({ cpf: e.target.value })}
                    />
                  </label>
                )}
              </section>
              <section className="checkout-recurrence-option">
                <Repeat2 size={25} />
                <div>
                  <h2>Quer receber seus essenciais de novo?</h2>
                  <p>Escolha os produtos e a frequência da sua assinatura.</p>
                </div>
                <button
                  className="btn secondary"
                  disabled={!ready}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      draft: {
                        ...s.draft,
                        source: "cart",
                        items: [],
                        frequencyPending: [],
                      },
                    }));
                    router.push("/assinatura/configurar");
                  }}
                >
                  Criar assinatura <ArrowRight size={16} />
                </button>
              </section>
            </>
          ) : (
            <div className="checkout-empty">
              <h2>Seu carrinho está vazio.</h2>
              <p>
                Para continuar comprando, navegue pelas categorias do site ou
                faça uma busca pelo seu produto.
              </p>
              <Link className="btn primary" href="/comprar">
                Escolher produtos
              </Link>
            </div>
          )}
        </div>
        <aside className="checkout-box real-cart-summary">
          {state.cart.length > 0 && (
            <>
              <h2>4. Resumo da compra</h2>
              <form
                className="checkout-coupon"
                onSubmit={(e) => {
                  e.preventDefault();
                  notify(
                    "Não há um cupom aplicável a esta compra no protótipo.",
                  );
                }}
              >
                <input
                  aria-label="Cupom de desconto"
                  placeholder="Insira seu cupom"
                />
                <button className="btn primary">Aplicar</button>
              </form>
              <Link className="checkout-coupons-link" href="/cupons">
                Ver cupons disponíveis
              </Link>
              <div className="checkout-freight">
                <Truck size={20} />
                <p>O frete será calculado na etapa de entrega.</p>
              </div>
              <div className="checkout-total-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="checkout-total-row total">
                <span>Total</span>
                <span>{money(subtotal)}</span>
              </div>
            </>
          )}
          <button
            className="checkout-list-button"
            onClick={() =>
              notify("Itens adicionados à lista Essenciais de casa.")
            }
          >
            <ListPlus size={18} />
            Criar lista do carrinho
          </button>
          {!canContinue && (
            <div className="checkout-before">
              <strong>Antes de finalizar</strong>
              <p>
                Para finalizar a compra, selecione o que fazer em caso de falta
                de um produto e se deseja CPF na nota.
              </p>
            </div>
          )}
          <button
            className="btn primary checkout-finalize"
            disabled={!ready || !canContinue || !state.cart.length}
            onClick={() => router.push("/checkout")}
          >
            <ShoppingCart size={20} />
            Finalizar pedido
          </button>
        </aside>
      </div>
    </main>
  );
}
