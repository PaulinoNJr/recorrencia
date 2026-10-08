"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Repeat2,
  ArrowRight,
  Pause,
  Play,
} from "lucide-react";
import assets from "@/data/home-assets.json";
import { products } from "@/data/products";
import { money } from "@/lib/utils";
import { useStore } from "./store";
import { ProductCartControl } from "./product-cart-control";
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
const slides = [null, ...assets.banners];
export function Storefront() {
  const { notify } = useStore();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => setSlide((i) => (i + 1) % slides.length),
      5000,
    );
    return () => clearTimeout(timer);
  }, [slide, paused]);
  const banner = slides[slide];
  const featured = ["leite", "ovos", "feijao", "pao", "oleo", "abacaxi"].map(
    (id) => products.find((p) => p.id === id)!,
  );
  const advance = (offset: number) =>
    setSlide((i) => (i + offset + slides.length) % slides.length);
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
          {banner ? (
            <Link href="/comprar" aria-label={"Ver produtos: " + banner.label}>
              <picture>
                <source
                  media="(max-width: 580px)"
                  srcSet={banner.mobileImage}
                />
                <img
                  src={banner.image}
                  alt={"Destaque " + banner.label}
                  width="1252"
                  height="388"
                  fetchPriority="high"
                />
              </picture>
            </Link>
          ) : (
            <section
              className="home-recurrence-banner"
              aria-labelledby="home-recurrence-heading"
            >
              <div className="home-recurrence-copy">
                <span className="home-recurrence-label">
                  <Repeat2 size={17} /> RECORRÊNCIAS COVABRA
                </span>
                <h2 id="home-recurrence-heading">
                  Seus essenciais.<em>No seu tempo.</em>
                </h2>
                <p>
                  Receba os produtos da sua rotina automaticamente. Você escolhe
                  a frequência e controla tudo.
                </p>
                <Link className="btn primary" href="/recorrencias">
                  Conheça a recorrência <ArrowRight size={18} />
                </Link>
              </div>
              <div className="home-recurrence-art" aria-hidden="true">
                <div className="home-recurrence-circle">
                  <Repeat2 size={140} strokeWidth={1} />
                </div>
                <img
                  className="recurrence-banner-milk"
                  src="/products/leite.jpg"
                  alt=""
                  width="80"
                  height="110"
                />
                <img
                  className="recurrence-banner-coffee"
                  src="/products/cafe.svg"
                  alt=""
                  width="80"
                  height="110"
                />
                <img
                  className="recurrence-banner-paper"
                  src="/products/papel.svg"
                  alt=""
                  width="80"
                  height="110"
                />
                <span>Uma rotina mais prática</span>
              </div>
            </section>
          )}
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
          <button
            className="hero-autoplay"
            aria-label={paused ? "Retomar carrossel" : "Pausar carrossel"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <div className="hero-dots">
            {slides.map((b, i) => (
              <button
                key={b?.image ?? "recorrencias"}
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
                <ProductCartControl product={p} />
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
