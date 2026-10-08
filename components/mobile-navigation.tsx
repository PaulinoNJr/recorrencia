"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Home,
  UserRound,
  Menu,
  BadgePercent,
  ShoppingCart,
  Repeat2,
  Heart,
  ShoppingBasket,
  X,
  ChevronRight,
} from "lucide-react";
import { useStore } from "./store";

export type MobileMenu = "menu" | "account" | null;
export function MobileNavigation({
  mode,
  onChange,
}: {
  mode: MobileMenu;
  onChange: (mode: MobileMenu) => void;
}) {
  const path = usePathname();
  const { state } = useStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!mode) return;
    const trigger = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 801px)");
    const closeOnDesktop = () => {
      if (media.matches) onChange(null);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => {
      media.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [mode, onChange]);
  const close = () => onChange(null);
  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
        <Link href="/" aria-current={path === "/" ? "page" : undefined}>
          <Home size={22} />
          <span>Início</span>
        </Link>
        <button
          type="button"
          aria-label="Menu de Robson"
          aria-expanded={mode === "account"}
          aria-controls="mobile-store-menu"
          onClick={() => onChange("account")}
        >
          <UserRound size={22} />
          <span>Conta</span>
        </button>
        <button
          type="button"
          aria-expanded={mode === "menu"}
          aria-controls="mobile-store-menu"
          onClick={() => onChange("menu")}
        >
          <Menu size={22} />
          <span>Categorias</span>
        </button>
        <Link
          href="/cupons"
          aria-current={path === "/cupons" ? "page" : undefined}
        >
          <BadgePercent size={22} />
          <span>Cupons</span>
        </Link>
        <Link href="/carrinho">
          <span className="mobile-cart-icon">
            <ShoppingCart size={22} />
            <b>{state.cart.length}</b>
          </span>
          <span>Carrinho</span>
        </Link>
      </nav>
      {mode && (
        <dialog
          id="mobile-store-menu"
          ref={dialogRef}
          className="mobile-store-drawer"
          aria-labelledby="mobile-menu-title"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onClick={(event) => {
            if (event.target === dialogRef.current) close();
          }}
        >
          <div className="mobile-drawer-heading">
            <h2 id="mobile-menu-title">
              {mode === "account" ? "Olá, Robson!" : "Menu"}
            </h2>
            <button type="button" aria-label="Fechar menu" onClick={close}>
              <X size={24} />
            </button>
          </div>
          <nav
            aria-label={
              mode === "account" ? "Minha conta" : "Menu de categorias"
            }
          >
            {mode === "menu" ? (
              <>
                <Link
                  className="mobile-recurrence-entry"
                  href="/recorrencias"
                  onClick={close}
                >
                  <Repeat2 size={22} />
                  <span>
                    Recorrências Covabra
                    <small>Seus produtos, no seu tempo</small>
                  </span>
                  <ChevronRight size={18} />
                </Link>
                <a
                  href="https://www.covabra.com.br/jornal-de-ofertas"
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                >
                  Jornal de Ofertas
                </a>
                <Link href="/comprar?ofertas=1" onClick={close}>
                  <BadgePercent size={20} />
                  Ofertas
                </Link>
                <button type="button" onClick={() => onChange("account")}>
                  <UserRound size={20} />
                  Minha conta
                  <ChevronRight size={18} />
                </button>
                <a
                  href="https://www.covabra.com.br/nossas-lojas"
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                >
                  Nossas lojas
                </a>
                <Link href="/listas" onClick={close}>
                  <Heart size={20} />
                  Minhas listas
                </Link>
                <Link href="/comprar" onClick={close}>
                  <ShoppingBasket size={20} />
                  Montar compra
                </Link>
                <h3>Departamentos</h3>
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
                    onClick={close}
                  >
                    {category}
                    <ChevronRight size={18} />
                  </Link>
                ))}
              </>
            ) : (
              <>
                <p className="mobile-account-intro">Seu espaço no Covabra</p>
                <Link href="/listas" onClick={close}>
                  <Heart size={20} />
                  Minhas listas
                </Link>
                <Link href="/minhas-assinaturas" onClick={close}>
                  <Repeat2 size={20} />
                  Recorrências
                  <ChevronRight size={18} />
                </Link>
                <Link
                  className="mobile-recurrence-entry"
                  href="/recorrencias"
                  onClick={close}
                >
                  Conheça as recorrências Covabra
                  <ChevronRight size={18} />
                </Link>
              </>
            )}
          </nav>
        </dialog>
      )}
    </>
  );
}
