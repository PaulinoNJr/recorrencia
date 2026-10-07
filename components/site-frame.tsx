"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";
import { Header, Footer } from "./shell";
import { useStore } from "./store";
const paymentMarks = [
  "amex",
  "master",
  "visa",
  "hipercard2",
  "elo",
  "dinners",
  "alelo",
];
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { reset } = useStore();
  const recurring = path.startsWith("/assinatura/");
  const checkout =
    recurring || path === "/carrinho" || path.startsWith("/checkout");
  if (!checkout)
    return (
      <>
        <Header />
        {children}
        <Footer />
      </>
    );
  const labels = recurring
    ? ["Produtos", "Entrega", "Pagamento", "Revisão"]
    : ["Carrinho", "Dados pessoais", "Entrega", "Pagamento"];
  const routes = recurring
    ? [
        "/assinatura/configurar",
        "/assinatura/entrega",
        "/assinatura/pagamento",
        "/assinatura/revisao",
      ]
    : ["/carrinho", "/checkout", "/checkout/entrega", "/checkout/pagamento"];
  const active = recurring
    ? Math.max(
        0,
        ["configurar", "entrega", "pagamento", "revisao", "sucesso"].indexOf(
          path.split("/").pop()!,
        ),
      )
    : path === "/carrinho"
      ? 0
      : path.endsWith("entrega")
        ? 2
        : path.endsWith("pagamento") || path.endsWith("sucesso")
          ? 3
          : 1;
  return (
    <div className="official-checkout">
      <header className="checkout-header">
        <div className="checkout-width checkout-header-inner">
          <Link href="/" aria-label="Covabra início">
            <img src="/logo.webp" alt="Covabra" width="112" height="40" />
          </Link>
          <nav className="checkout-progress" aria-label="Etapas do checkout">
            {labels.map((label, i) => (
              <Link
                key={label}
                href={routes[i]}
                className={i <= active ? "completed" : ""}
                aria-current={i === active ? "step" : undefined}
                aria-disabled={i > active || undefined}
                onClick={(event) => {
                  if (i > active) event.preventDefault();
                }}
              >
                <span>
                  {i < active ? (
                    <Check size={12} />
                  ) : (
                    <span className="checkout-dot" />
                  )}
                </span>
                <small>{label}</small>
              </Link>
            ))}
          </nav>
          <span className="checkout-secure">
            <LockKeyhole size={20} />
            Compra 100% segura
          </span>
        </div>
      </header>
      {children}
      <footer className="checkout-footer">
        <div className="checkout-width">
          <p>
            © 2019 Covabra Supermercados. Todos os direitos reservados. CNPJ sob
            n.º 61.233.151/0001-84, com sede a Rua Domingos Pretti, nº 165,
            Jardim de Lucca, Itatiba – SP, CEP 13255-280. Pedidos sujeitos a
            análise e confirmação de dados. Produtos, preços, ofertas e
            condições de pagamento são válidos exclusivamente para o site
            covabra.com.br, podendo sofrer alterações sem aviso prévio. Fotos
            meramente ilustrativas. É proibida a venda e a entrega de bebidas
            alcoólicas a menores de 18 anos.
          </p>
          <div className="checkout-payment-marks">
            {paymentMarks.map((name) => (
              <img
                key={name}
                src={`/checkout-assets/icon-checkout-${name}.png`}
                alt={name === "master" ? "Mastercard" : name}
                width="40"
                height="24"
              />
            ))}
            <span>Protótipo · Nenhuma cobrança real é realizada.</span>
          </div>
          <div className="checkout-prototype-links">
            <Link href="/operacao">Área de operação</Link>
            <button onClick={reset}>Restaurar dados do protótipo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
