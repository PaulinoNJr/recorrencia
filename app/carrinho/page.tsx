"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Repeat2,
  ShoppingBag,
  CalendarDays,
  SlidersHorizontal,
  Pause,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { Breadcrumb } from "@/components/shell";
import { CartItems } from "@/components/products";
import {
  Summary,
  PageHeading,
  Button,
  Modal,
  EmptyState,
} from "@/components/ui";
import { money, total } from "@/lib/utils";
export default function Cart() {
  const { state, setState, notify } = useStore();
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <main className="container">
      <Breadcrumb items={[{ label: "Meu carrinho" }]} />
      <PageHeading
        title="Meu carrinho"
        description={`${state.cart.length} produtos escolhidos para a sua casa`}
        action={
          <Link className="text-action" href="/comprar">
            <ArrowLeft size={16} />
            Continuar comprando
          </Link>
        }
      />
      {state.cart.length ? (
        <div className="content-grid">
          <div>
            <CartItems
              items={state.cart}
              onChange={(cart) => setState((s) => ({ ...s, cart }))}
            />
            <div className="delivery-strip">
              <Truck size={23} />
              <div>
                <strong>Entrega em Sumaré, SP</strong>
                <p>Rua das Flores, 123 · Jardim Primavera</p>
              </div>
              <Link href="/assinatura/entrega">Alterar</Link>
            </div>
            <section className="continuation">
              <div className="section-intro">
                <h2>Como deseja continuar?</h2>
                <p>Uma compra para agora ou mais praticidade para a rotina.</p>
              </div>
              <div className="continuation-grid">
                <div className="purchase-option panel">
                  <ShoppingBag size={25} />
                  <h3>Compra única</h3>
                  <p>Receba todos os produtos apenas nesta compra.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDone(false);
                      setCheckout(true);
                    }}
                  >
                    Finalizar compra <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="subscription-option panel">
                  <span className="new-label">NO SEU TEMPO</span>
                  <Repeat2 size={27} />
                  <h3>Uma rotina mais prática</h3>
                  <p>Escolha os produtos que deseja receber automaticamente.</p>
                  <Button
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        draft: { ...s.draft, source: "cart", items: [] },
                      }));
                      router.push("/assinatura/configurar");
                    }}
                  >
                    Criar assinatura <ArrowRight size={16} />
                  </Button>
                  <small>Você escolhe quais produtos incluir.</small>
                </div>
              </div>
            </section>
            <div className="benefit-row">
              <span>
                <CalendarDays />
                Controle quando receber
              </span>
              <span>
                <SlidersHorizontal />
                Ajuste do seu jeito
              </span>
              <span>
                <Pause />
                Pause quando precisar
              </span>
            </div>
          </div>
          <Summary items={state.cart} cart>
            <p className="cart-summary-copy">
              Tudo pronto para o próximo passo.
              <br />
              Escolha como deseja continuar ao lado.
            </p>
          </Summary>
        </div>
      ) : (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Escolha os produtos que fazem parte da sua rotina."
        />
      )}
      {checkout && (
        <Modal
          title={done ? "Compra realizada!" : "Finalizar compra única"}
          onClose={() => setCheckout(false)}
        >
          {done ? (
            <>
              <div className="success-icon">✓</div>
              <p>
                Pedido de demonstração #09281 recebido. Todos os itens serão
                entregues apenas nesta compra.
              </p>
              <Button
                onClick={() => {
                  setCheckout(false);
                  router.push("/comprar");
                }}
              >
                Continuar comprando
              </Button>
            </>
          ) : (
            <>
              <p>
                {state.cart.length} produtos · Total estimado{" "}
                {money(total(state.cart) + 9.9)}
              </p>
              <div className="notice">
                Entrega: 15/10/2026 · 08h às 12h
                <br />
                Casa · Mastercard •••• 4821
              </div>
              <Button
                onClick={() => {
                  setDone(true);
                  notify("Pedido de demonstração confirmado.");
                }}
              >
                Confirmar compra única
              </Button>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
