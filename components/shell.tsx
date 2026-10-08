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
  TicketPercent,
  Newspaper,
  Gift,
  ShoppingBasket,
  BadgePercent,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useStore } from "./store";
import { MobileNavigation, MobileMenu } from "./mobile-navigation";
export function Header() {
  const { state } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState<MobileMenu>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <header>
      <div className="mobile-promotion">
        <Truck size={17} />
        FRETE GRÁTIS a partir de R$299
      </div>
      <div className="official-topbar">
        <div className="container">
          <a
            href="https://promocoes.covabra.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            <Gift size={15} />
            Campanha de Sorte
          </a>
          <a
            href="https://www.covabra.com.br/jornal-de-ofertas"
            target="_blank"
            rel="noreferrer"
          >
            <Newspaper size={15} />
            Jornal de Ofertas
          </a>
          <a
            href="https://www.covabra.com.br/nossas-lojas"
            target="_blank"
            rel="noreferrer"
          >
            <MapPin size={15} />
            Nossas Lojas
          </a>
        </div>
      </div>
      <div className="official-servicebar">
        <div className="container">
          <Link href="/cupons">
            <TicketPercent size={17} />
            Economize com <strong>CUPOM DE DESCONTO</strong>
          </Link>
          <span>Valor mínimo de compra R$30</span>
          <span>
            <CreditCardIcon />
            Parcele em até 3x sem juros
          </span>
        </div>
      </div>
      <div className="container main-header">
        <button
          className="mobile-menu-trigger"
          type="button"
          aria-label="Abrir menu de categorias"
          aria-expanded={mobileMenu === "menu"}
          aria-controls="mobile-store-menu"
          onClick={() => setMobileMenu("menu")}
        >
          <Menu size={23} />
        </button>
        <Link href="/" aria-label="Covabra início">
          <img
            className="logo"
            src="/logo.webp"
            alt="Covabra Supermercados"
            width="165"
            height="58"
          />
        </Link>
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
        <div
          className="account-menu"
          ref={accountRef}
          onMouseEnter={() => {
            if (window.matchMedia("(hover: hover)").matches)
              setAccountOpen(true);
          }}
          onMouseLeave={(e) => {
            if (
              window.matchMedia("(hover: hover)").matches &&
              !e.currentTarget.contains(document.activeElement)
            )
              setAccountOpen(false);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              setAccountOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setAccountOpen(false);
              accountRef.current?.querySelector("button")?.focus();
            }
            if (
              e.key === "ArrowDown" &&
              e.target === accountRef.current?.querySelector("button")
            ) {
              e.preventDefault();
              setAccountOpen(true);
              requestAnimationFrame(() =>
                accountRef.current?.querySelector("a")?.focus(),
              );
            }
          }}
        >
          <button
            className="account"
            aria-label="Menu de Robson"
            aria-expanded={accountOpen}
            aria-controls="robson-dropdown"
            onClick={(e) => setAccountOpen((v) => (e.detail === 0 ? !v : true))}
          >
            <UserRound size={25} />
            <span>
              Olá,
              <strong>
                Robson <ChevronDown size={13} />
              </strong>
            </span>
          </button>
          <div
            id="robson-dropdown"
            className="account-dropdown"
            hidden={!accountOpen}
          >
            <div>
              <strong>Olá, Robson!</strong>
              <p>Seu espaço no Covabra</p>
            </div>
            <Link href="/listas" onClick={() => setAccountOpen(false)}>
              <Heart size={18} />
              Minhas listas
            </Link>
            <Link
              href="/minhas-assinaturas"
              className={path.includes("assinatura") ? "selected" : ""}
              onClick={() => setAccountOpen(false)}
            >
              <Repeat2 size={18} />
              Recorrências <small>NOVO</small>
            </Link>
          </div>
        </div>
        <Link className="cart-link" href="/carrinho">
          <ShoppingCart size={25} />
          <b>{state.cart.length}</b>
        </Link>
      </div>
      <div className="mobile-delivery-context">
        <span>
          Entrega em:{" "}
          <strong>
            {state.addresses.find(
              (address) => address.id === state.draft.addressId,
            )?.city || "Selecione no checkout"}
          </strong>
        </span>
        <span>Frete no checkout</span>
      </div>
      <nav
        className="department-navigation"
        aria-label="Departamentos e ofertas"
      >
        <div className="container department-nav-inner">
          <div className="department-links">
            <Link className="categories-link" href="/comprar">
              <Menu size={28} />
              Categorias
            </Link>
            {[
              "Bebidas",
              "Mercearia",
              "Hortifruti",
              "Laticínios",
              "Limpeza",
              "Carnes",
              "Padaria",
              "Higiene",
            ].map((category) => (
              <Link
                key={category}
                href={"/comprar?categoria=" + encodeURIComponent(category)}
              >
                {category}
              </Link>
            ))}
          </div>
          <div className="department-actions">
            <Link
              className="nav-pill recurrence-nav"
              href="/recorrencias"
              aria-current={path === "/recorrencias" ? "page" : undefined}
            >
              Recorrências
            </Link>
            <Link className="nav-pill" href="/cupons">
              <BadgePercent size={23} />
              Cupons
            </Link>
            <Link className="nav-pill" href="/comprar?ofertas=1">
              Ofertas
            </Link>
            <Link className="nav-pill build-shopping" href="/comprar">
              <ShoppingBasket size={30} />
              Montar Compra
            </Link>
          </div>
        </div>
      </nav>
      <MobileNavigation mode={mobileMenu} onChange={setMobileMenu} />
    </header>
  );
}
function CreditCardIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 9h20M6 15h4" />
    </svg>
  );
}
export function Footer() {
  const { reset } = useStore();
  return (
    <footer>
      <div className="mobile-footer-links">
        <details>
          <summary>
            Institucional <ChevronDown size={18} />
          </summary>
          <a
            href="https://www.covabra.com.br/nossas-lojas"
            target="_blank"
            rel="noreferrer"
          >
            Nossas lojas
          </a>
          <a
            href="https://blog.covabra.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            Blog Covabra
          </a>
          <a
            href="https://www.covabra.com.br/jornal-de-ofertas"
            target="_blank"
            rel="noreferrer"
          >
            Jornal de Ofertas
          </a>
        </details>
        <details>
          <summary>
            Políticas <ChevronDown size={18} />
          </summary>
          <a
            href="https://www.covabra.com.br/termos-e-politicas"
            target="_blank"
            rel="noreferrer"
          >
            Políticas do Covabra
          </a>
        </details>
        <details>
          <summary>
            Atendimento <ChevronDown size={18} />
          </summary>
          <a
            href="https://www.covabra.com.br/fale-conosco"
            target="_blank"
            rel="noreferrer"
          >
            Fale conosco
          </a>
        </details>
        <details>
          <summary>
            Outros contatos <ChevronDown size={18} />
          </summary>
          <a href="https://www.covabra.com.br" target="_blank" rel="noreferrer">
            Acesse o site Covabra
          </a>
        </details>
      </div>
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
      <Link href="/">Início</Link>
      {items.map((item, i) => (
        <span key={i}>
          ›{" "}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </div>
  );
}
