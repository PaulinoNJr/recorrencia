"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  UserRound,
  ShoppingCart,
  Repeat2,
  Heart,
  Menu,
  ChevronDown,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "./store";
export function Header() {
  const { state } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  return (
    <header>
      <div className="topbar">
        <div className="container">
          <span>Seu supermercado, pertinho de você.</span>
          <span>
            Jornal de ofertas <i /> Nossas lojas <i /> Atendimento
          </span>
        </div>
      </div>
      <div className="container main-header">
        <Link href="/carrinho" aria-label="Covabra início">
          <img
            className="logo"
            src="/logo.webp"
            alt="Covabra Supermercados"
            width="165"
            height="58"
          />
        </Link>
        <button
          className="location"
          onClick={() => router.push("/assinatura/entrega")}
        >
          <MapPin size={21} />
          <span>
            Entregar em{" "}
            <strong>
              Sumaré, SP <ChevronDown size={13} />
            </strong>
          </span>
        </button>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/comprar?q=" + encodeURIComponent(search));
          }}
        >
          <input
            aria-label="Buscar produtos"
            placeholder="O que você procura hoje?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button aria-label="Pesquisar">
            <Search size={21} />
          </button>
        </form>
        <Link className="account" href="/minhas-assinaturas">
          <UserRound size={25} />
          <span>
            Olá, Robson<strong>Minha conta</strong>
          </span>
        </Link>
        <Link className="cart-link" href="/carrinho">
          <ShoppingCart size={25} />
          <b>{state.cart.length}</b>
        </Link>
      </div>
      <nav>
        <div className="container nav-inner">
          <Link href="/comprar">
            <Menu size={19} />
            Todos os departamentos
          </Link>
          <Link href="/comprar?ofertas=1">Ofertas</Link>
          <Link href="/cupons">Cupons</Link>
          <Link href="/listas">
            <Heart size={17} />
            Minhas listas
          </Link>
          <Link
            className={path.includes("assinatura") ? "nav-active" : ""}
            href="/minhas-assinaturas"
          >
            <Repeat2 size={18} />
            Minhas assinaturas <small>NOVO</small>
          </Link>
          <span className="nav-end">
            <Truck size={17} />
            Praticidade na sua rotina
          </span>
        </div>
      </nav>
    </header>
  );
}
export function Footer() {
  const { reset } = useStore();
  return (
    <footer>
      <div className="container footer-benefits">
        <span>
          <ShieldCheck />
          Compra com tranquilidade
        </span>
        <span>
          <Truck />
          Tudo para sua casa
        </span>
        <span>
          <Headphones />
          Sempre perto de você
        </span>
      </div>
      <div className="container footer-bottom">
        <img src="/logo.webp" alt="Covabra" width="110" height="39" />
        <p>Protótipo de experiência · Nenhuma cobrança real é realizada.</p>
        <Link href="/operacao">Área de operação</Link>
        <button onClick={reset}>Restaurar dados do protótipo</button>
      </div>
    </footer>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <div className="breadcrumb">
      <Link href="/carrinho">Início</Link>
      {items.map((item, i) => (
        <span key={i}>
          ›{" "}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </div>
  );
}
