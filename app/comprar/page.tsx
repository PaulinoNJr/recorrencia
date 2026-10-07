import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
export default function Page() {
  return (
    <Suspense
      fallback={<main className="container loading">Carregando produtos…</main>}
    >
      <Catalog />
    </Suspense>
  );
}
