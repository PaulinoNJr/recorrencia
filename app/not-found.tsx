import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container empty">
      <h1>Não encontramos esta página</h1>
      <p>Continue para o seu carrinho ou suas assinaturas.</p>
      <Link className="btn primary" href="/carrinho">
        Voltar ao carrinho
      </Link>
    </main>
  );
}
