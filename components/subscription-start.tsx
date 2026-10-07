"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingCart, Search } from "lucide-react";
import { useStore } from "./store";
import { Modal } from "./ui";
import { productById } from "@/data/products";

export function SubscriptionStart({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { state, setState, ready } = useStore();
  const router = useRouter();
  const start = (source: "cart" | "catalog") => {
    setState((s) => ({
      ...s,
      draft: {
        ...s.draft,
        source,
        frequencyPending:
          source === "cart"
            ? s.cart
                .filter((item) => productById(item.productId).eligible)
                .map((item) => item.productId)
            : [],
        items:
          source === "cart"
            ? s.cart
                .filter((item) => productById(item.productId).eligible)
                .map((item) => ({ ...item }))
            : [],
      },
    }));
    setOpen(false);
    router.push("/assinatura/configurar");
  };
  return (
    <>
      <button
        className="btn primary"
        disabled={!ready}
        onClick={() => (state.cart.length ? setOpen(true) : start("catalog"))}
      >
        {children}
        <ArrowRight size={18} />
      </button>
      {open && (
        <Modal
          title="Como quer montar sua assinatura?"
          onClose={() => setOpen(false)}
        >
          <p>
            Escolha de onde vêm os produtos. Depois, ajuste as quantidades e
            frequências.
          </p>
          <div className="subscription-source-options">
            <button
              onClick={() => start("cart")}
              disabled={
                !state.cart.some((item) => productById(item.productId).eligible)
              }
            >
              <ShoppingCart size={26} />
              <span>
                <strong>Do meu carrinho atual</strong>
                <small>
                  {state.cart.length
                    ? "Traga os itens disponíveis para assinatura, com as quantidades do seu carrinho."
                    : "Seu carrinho está vazio. Escolha produtos no catálogo."}
                </small>
              </span>
              <ArrowRight size={19} />
            </button>
            <button onClick={() => start("catalog")}>
              <Search size={26} />
              <span>
                <strong>Do catálogo de produtos</strong>
                <small>
                  Veja todos os produtos, busque seus essenciais e escolha o que
                  incluir.
                </small>
              </span>
              <ArrowRight size={19} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
