"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { products } from "@/data/products";
import { useStore } from "./store";
import { Button, PageHeading } from "./ui";
import { Breadcrumb } from "./shell";
import { money } from "@/lib/utils";
export function Catalog() {
  const query = useSearchParams();
  const { setState, notify } = useStore();
  const q = query.get("q") || "";
  const [category, setCategory] = useState("Todos");
  const visible = products.filter(
    (p) =>
      p.id !== "substituto" &&
      p.name
        .toLocaleLowerCase("pt-BR")
        .includes(q.toLocaleLowerCase("pt-BR")) &&
      (category === "Todos" || p.category.startsWith(category)) &&
      (query.get("ofertas") !== "1" || p.previousPrice),
  );
  return (
    <main className="container">
      <Breadcrumb items={[{ label: "Montar compra" }]} />
      <PageHeading
        title={
          q
            ? `Resultados para “${q}”`
            : query.get("ofertas")
              ? "Ofertas para sua casa"
              : "O que sua casa precisa hoje?"
        }
        description="Escolha seus produtos. Depois, decida o que combina com uma assinatura."
        action={
          <Link className="btn secondary" href="/carrinho">
            <ShoppingCart size={17} />
            Ver carrinho
          </Link>
        }
      />
      <div className="tabs">
        {[
          "Todos",
          "Mercearia",
          "Laticínios",
          "Hortifruti",
          "Higiene",
          "Padaria",
        ].map((c) => (
          <button
            key={c}
            className={c === category ? "selected" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {visible.map((p) => (
          <article className="panel catalog-product" key={p.id}>
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <p>{p.category}</p>
            <strong>{money(p.price)}</strong>
            <Button
              onClick={() => {
                setState((s) => {
                  const exists = s.cart.some((i) => i.productId === p.id);
                  return {
                    ...s,
                    cart: exists
                      ? s.cart.map((i) =>
                          i.productId === p.id
                            ? { ...i, quantity: Math.min(99, i.quantity + 1) }
                            : i,
                        )
                      : [
                          ...s.cart,
                          {
                            productId: p.id,
                            quantity: 1,
                            frequency: p.frequency,
                          },
                        ],
                  };
                });
                notify(p.name + " adicionado ao carrinho.");
              }}
            >
              <Plus size={16} />
              Adicionar
            </Button>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <h2>Nenhum produto encontrado</h2>
          <p>Tente buscar por leite, café ou pão.</p>
          <Link className="btn secondary" href="/comprar">
            Ver todos os produtos
          </Link>
        </div>
      )}
    </main>
  );
}
export function Auxiliary({ kind }: { kind: "cupons" | "listas" }) {
  return (
    <main className="container">
      <Breadcrumb
        items={[{ label: kind === "cupons" ? "Cupons" : "Minhas listas" }]}
      />
      <PageHeading
        title={kind === "cupons" ? "Seus cupons" : "Minhas listas"}
        description={
          kind === "cupons"
            ? "Quando houver cupons disponíveis, você poderá encontrá-los aqui."
            : "Os produtos do dia a dia, reunidos em um só lugar."
        }
      />
      <div className="panel section-panel">
        <h2>
          {kind === "cupons"
            ? "Nenhum cupom disponível no momento"
            : "Essenciais de casa"}
        </h2>
        <p>
          {kind === "cupons"
            ? "Continue explorando os produtos para a sua rotina."
            : "Leite integral, café, papel higiênico e feijão. Uma seleção para facilitar sua próxima compra."}
        </p>
        <Link className="btn primary" href="/comprar">
          {kind === "cupons"
            ? "Continuar comprando"
            : "Ver produtos da minha lista"}
        </Link>
      </div>
    </main>
  );
}
