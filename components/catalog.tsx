"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { products } from "@/data/products";
import { ProductCartControl } from "./product-cart-control";
import { PageHeading } from "./ui";
import { Breadcrumb } from "./shell";
import { money } from "@/lib/utils";
export function Catalog() {
  const query = useSearchParams();
  const q = query.get("q") || "";
  const department = query.get("categoria");
  const [category, setCategory] = useState("Todos");
  const visible = products.filter(
    (p) =>
      p.id !== "substituto" &&
      p.name
        .toLocaleLowerCase("pt-BR")
        .includes(q.toLocaleLowerCase("pt-BR")) &&
      (category === "Todos" || p.category.startsWith(category)) &&
      (!department || p.category.startsWith(department)) &&
      (query.get("ofertas") !== "1" || p.previousPrice),
  );
  return (
    <main className="container">
      <Breadcrumb items={[{ label: "Montar compra" }]} />
      <PageHeading
        title={
          q
            ? `Resultados para “${q}”`
            : department
              ? department
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
            <ProductCartControl product={p} />
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <h2>
            {department
              ? "Nenhum produto disponível nesta categoria"
              : "Nenhum produto encontrado"}
          </h2>
          <p>
            {department
              ? "Explore as outras categorias para continuar suas compras."
              : "Tente buscar por leite, café ou pão."}
          </p>
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
