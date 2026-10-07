"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  ShoppingCart,
} from "lucide-react";
import assets from "@/data/home-assets.json";
import { products } from "@/data/products";
import { money } from "@/lib/utils";
import { useStore } from "./store";
const categories = [
  "Plenitud",
  "Açougue",
  "Dia de Feira",
  "Bebidas",
  "Chocolates",
  "Padaria",
  "Frios",
  "Vinhos",
  "Limpeza",
  "Vitaminas & Suplementos",
];
const mosaicLabels = [
  "Vitaminas e suplementos",
  "Cliente Bem Estar",
  "Seleção de ofertas",
  "Cupons de desconto",
  "Rastreabilidade dos alimentos",
];
export function Storefront() {
  const { setState, notify } = useStore();
  const [slide, setSlide] = useState(0);
  const banner = assets.banners[slide];
  const featured = ["leite", "ovos", "feijao", "pao", "oleo", "abacaxi"].map(
    (id) => products.find((p) => p.id === id)!,
  );
  const advance = (offset: number) =>
    setSlide(
      (i) => (i + offset + assets.banners.length) % assets.banners.length,
    );
  return (
    <main className="storefront">
      <h1 className="sr-only">Covabra Supermercados</h1>
      <div className="home-container">
        <nav className="home-categories" aria-label="Categorias de produtos">
          {assets.categories.map((category, i) => (
            <Link
              key={category.image}
              href={"/comprar?categoria=" + encodeURIComponent(categories[i])}
            >
              <img src={category.image} alt="" width="96" height="98" />
              <span>{categories[i]}</span>
            </Link>
          ))}
        </nav>
        <section
          className="home-hero"
          aria-label="Destaques do Covabra"
          aria-roledescription="carrossel"
        >
          <Link href="/comprar" aria-label={"Ver produtos: " + banner.label}>
            <picture>
              <source media="(max-width: 580px)" srcSet={banner.mobileImage} />
              <img
                src={banner.image}
                alt={"Destaque " + banner.label}
                width="1252"
                height="388"
                fetchPriority="high"
              />
            </picture>
          </Link>
          <button
            className="hero-prev"
            aria-label="Banner anterior"
            onClick={() => advance(-1)}
          >
            <ChevronLeft />
          </button>
          <button
            className="hero-next"
            aria-label="Próximo banner"
            onClick={() => advance(1)}
          >
            <ChevronRight />
          </button>
          <div className="hero-dots">
            {assets.banners.map((b, i) => (
              <button
                key={b.image}
                aria-label={"Mostrar banner " + (i + 1)}
                aria-current={i === slide ? "true" : undefined}
                className={i === slide ? "active" : ""}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </section>
        <section className="home-mosaic" aria-label="Novidades e serviços">
          {assets.mosaic.map((tile, i) => (
            <Link
              key={tile.image}
              href={i === 3 ? "/cupons" : "/comprar"}
              aria-label={mosaicLabels[i]}
            >
              <img
                src={tile.image}
                alt={mosaicLabels[i]}
                width="236"
                height="411"
              />
            </Link>
          ))}
        </section>
        <section className="home-offers" aria-labelledby="offers-heading">
          <div className="home-section-heading">
            <h2 id="offers-heading">
              Ofertas Bem Estar<span aria-hidden="true">🛒</span>
            </h2>
            <Link href="/comprar?ofertas=1">
              Ver mais
              <ChevronRight size={17} />
            </Link>
          </div>
          <div className="home-product-grid">
            {featured.map((p) => (
              <article className="home-product" key={p.id}>
                <button
                  className="product-favorite"
                  aria-label={"Adicionar " + p.name + " à minha lista"}
                  onClick={() =>
                    notify(p.name + " adicionado à lista Essenciais de casa.")
                  }
                >
                  <Heart size={18} />
                </button>
                <Link href={"/comprar?q=" + encodeURIComponent(p.name)}>
                  <img src={p.image} alt={p.name} width="148" height="148" />
                  <h3>
                    {p.name} {p.category.split("·")[1]}
                  </h3>
                </Link>
                <div className="home-price">
                  {p.previousPrice && <del>{money(p.previousPrice)}</del>}
                  <strong>{money(p.price)}</strong>
                </div>
                <button
                  className="btn primary"
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      cart: s.cart.some((i) => i.productId === p.id)
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
                    }));
                    notify(p.name + " adicionado ao carrinho.");
                  }}
                >
                  <Plus size={17} />
                  Adicionar
                </button>
              </article>
            ))}
          </div>
        </section>
        {assets.secondary.map((tile, i) => (
          <Link
            className="home-wide-banner"
            key={tile.image}
            href="/comprar"
            aria-label={
              i === 0 ? "Confira os destaques" : "Conheça o Cliente Bem Estar"
            }
          >
            <img
              src={tile.image}
              alt={i === 0 ? "Destaques Covabra" : "Cliente Bem Estar"}
              width="1252"
              height="250"
            />
          </Link>
        ))}
        <div className="home-cart-cta">
          <ShoppingCart size={21} />
          <p>
            Seus produtos estão no carrinho. Continue sua compra quando quiser.
          </p>
          <Link className="btn primary" href="/carrinho">
            Ver meu carrinho
            <ChevronRight size={17} />
          </Link>
        </div>
        <section className="home-about">
          <p>
            Com mais de 35 anos de história, o Covabra está presente no interior
            de São Paulo, levando qualidade, variedade e economia para a sua
            casa.
          </p>
          <p>
            Nas lojas físicas e on-line, estamos sempre perto de você para
            tornar suas compras mais práticas.
          </p>
        </section>
      </div>
    </main>
  );
}
