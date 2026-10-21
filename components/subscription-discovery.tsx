"use client";

import { useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { products } from "@/data/products";
import { Product } from "@/types";
import { money } from "@/lib/utils";
import { ProductCartControl } from "./product-cart-control";
import { useStore } from "./store";

const catalog = products.filter((product) => product.id !== "substituto" && product.eligible);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
const complements: Record<string, string[]> = {
  leite: ["pao", "cafe", "ovos"],
  cafe: ["leite", "pao"],
  pao: ["leite", "ovos", "cafe"],
  ovos: ["pao", "leite"],
  feijao: ["oleo", "ovos"],
  oleo: ["feijao", "ovos"],
};

function ProductCards({ items }: { items: Product[] }) {
  return (
    <div className="subscription-discovery-grid">
      {items.map((product) => (
        <article className="panel catalog-product" key={product.id} aria-label={product.name}>
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.category}</p>
          <strong>{money(product.price)}</strong>
          <ProductCartControl product={product} />
        </article>
      ))}
    </div>
  );
}

export function SubscriptionDiscovery({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  const [browse, setBrowse] = useState(false);
  const visible = catalog.filter((product) => normalize(`${product.name} ${product.category}`).includes(normalize(search.trim())));
  const expanded = browse || !!search.trim();
  return (
    <section className="panel subscription-discovery" aria-labelledby="discover-products-title">
      <h2 id="discover-products-title"><Search size={21} /> Encontre novos produtos</h2>
      <p>Adicione ao carrinho sem sair desta etapa. Depois, selecione os itens que deseja incluir na assinatura.</p>
      <label htmlFor="subscription-product-search">Buscar no catálogo de produtos</label>
      <input id="subscription-product-search" type="search" placeholder="Ex.: leite, pão ou mercearia" value={search} onChange={(event) => onSearch(event.target.value)} />
      {expanded && (
        <div id="subscription-search-results">
          <p role="status">{visible.length} {visible.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
          {visible.length ? <ProductCards items={visible} /> : (
            <div className="empty">
              <h3>Nenhum produto encontrado</h3>
              <p>Tente outro nome ou categoria.</p>
              <button type="button" className="btn secondary" onClick={() => { onSearch(""); setBrowse(true); }}>Ver todos os produtos</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function SubscriptionRecommendations() {
  const { state } = useStore();
  const selected = new Set([...state.cart, ...state.draft.items].map((item) => item.productId));
  const score = (product: Product) => [...selected].reduce((value, id) => value + (complements[id]?.includes(product.id) ? 2 : 0), 0);
  const suggestions = catalog.filter((product) => !selected.has(product.id)).sort((a, b) => score(b) - score(a)).slice(0, 3);
  if (!suggestions.length) return null;
  return (
    <section className="subscription-recommendations" aria-labelledby="buy-also-title">
      <h2 id="buy-also-title"><ShoppingBag size={22} /> Compre também</h2>
      <p>Que tal completar sua compra? Veja sugestões que combinam com os produtos escolhidos.</p>
      <ProductCards items={suggestions} />
    </section>
  );
}
