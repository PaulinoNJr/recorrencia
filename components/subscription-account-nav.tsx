"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Repeat2, Wallet } from "lucide-react";

export function SubscriptionAccountNav() {
  const path = usePathname();
  return (
    <nav className="subscription-account-nav" aria-label="Minhas compras recorrentes">
      <Link href="/minhas-assinaturas" aria-current={path === "/minhas-assinaturas" ? "page" : undefined}>
        <Repeat2 size={18} /> Visão geral
      </Link>
      <Link href="/minhas-assinaturas/financeiro" aria-current={path === "/minhas-assinaturas/financeiro" ? "page" : undefined}>
        <Wallet size={18} /> Financeiro
      </Link>
    </nav>
  );
}
