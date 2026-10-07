"use client";
import Link from "next/link";
import { useStore } from "./store";
import { Breadcrumb } from "./shell";
import { PageHeading, Badge } from "./ui";
import { money, total, dateLabel } from "@/lib/utils";
export function Operation() {
  const { state } = useStore();
  const subscriptions = state.subscriptions;
  const stats = [
    [
      "Assinaturas ativas",
      subscriptions.filter((s) => s.status === "Ativa").length,
    ],
    [
      "Próximos ciclos",
      subscriptions.filter(
        (s) => s.status === "Ativa" || s.status === "Pagamento recusado",
      ).length,
    ],
    [
      "Cobranças com falha",
      subscriptions.filter((s) => s.status === "Pagamento recusado").length,
    ],
    [
      "Assinaturas pausadas",
      subscriptions.filter((s) => s.status === "Pausada").length,
    ],
    [
      "Cancelamentos",
      subscriptions.filter((s) => s.status === "Cancelada").length,
    ],
  ];
  return (
    <main className="container">
      <Breadcrumb items={[{ label: "Operação" }]} />
      <PageHeading
        eyebrow="COVABRA · VISÃO INTERNA"
        title="Operação de assinaturas"
        description="Uma visão dos próximos recebimentos e dos pontos que precisam de atenção."
      />
      <div className="ops-stats">
        {stats.map(([label, count]) => (
          <div className="panel" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <section className="panel ops-table">
        <div className="ops-row table-header">
          <span>CLIENTE</span>
          <span>ASSINATURA</span>
          <span>PRÓXIMO CICLO</span>
          <span>VALOR ESTIMADO</span>
          <span>STATUS</span>
        </div>
        {subscriptions.map((s) => (
          <Link
            className="ops-row"
            key={s.id}
            href={"/operacao/assinaturas/" + s.id}
          >
            <span>Robson Ferreira</span>
            <span>#{s.id}</span>
            <span>{s.status === "Cancelada" ? "—" : dateLabel(s.date)}</span>
            <span>{money(total(s.items) + 9.9)}</span>
            <Badge status={s.status} />
          </Link>
        ))}
      </section>
    </main>
  );
}
