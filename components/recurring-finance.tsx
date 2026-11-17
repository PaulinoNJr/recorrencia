"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Info, Wallet } from "lucide-react";
import { useStore } from "./store";
import { Breadcrumb } from "./shell";
import { Badge, PageHeading } from "./ui";
import { SubscriptionAccountNav } from "./subscription-account-nav";
import { saoPauloToday } from "@/lib/delivery-date";
import { ESTIMATED_FREIGHT_CENTS, projectRecurringCosts } from "@/lib/recurring-finance";
import { addDays, dateLabel, money } from "@/lib/utils";

export function RecurringFinance() {
  const { state, ready } = useStore();
  const [today, setToday] = useState(saoPauloToday);
  const [showAll, setShowAll] = useState(false);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setToday(saoPauloToday());
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const projection = projectRecurringCosts(state.subscriptions, today);
  const moneyCents = (value: number) => money(value / 100);
  const selectedMonth = projection.months.find((month) => month.key === monthKey) ?? projection.months[0];
  const selectedMonthIndex = projection.months.findIndex((month) => month.key === selectedMonth.key);
  const monthName = selectedMonth.label + " de " + selectedMonth.year;
  const monthCharges = projection.upcomingCharges.filter((charge) => charge.date >= selectedMonth.start && charge.date < selectedMonth.end);
  const visibleCharges = showAll ? monthCharges : monthCharges.slice(0, 8);
  const activeCount = state.subscriptions.filter((subscription) => subscription.status === "Ativa").length;
  return (
    <main className="container recurring-finance">
      <Breadcrumb items={[{ label: "Minhas compras recorrentes", href: "/minhas-assinaturas" }, { label: "Financeiro" }]} />
      <PageHeading title="Financeiro" description="Acompanhe os gastos previstos das suas compras recorrentes. Todos os valores são estimados e podem variar a cada ciclo." />
      <SubscriptionAccountNav />
      {!ready ? <p className="loading">Carregando estimativas…</p> : (
        <>
          <div className="notice finance-estimate-notice">
            <Info size={21} />
            <span><strong>Preços e fretes estimados, sujeitos a variação.</strong> Os valores usam os preços atuais do catálogo. A projeção não realiza cobranças nem altera a compra de hoje.</span>
          </div>
          <section className="finance-period" aria-label="Período da estimativa mensal">
            <div><h2>Gastos estimados por mês</h2><p>Mês atual e os dois seguintes · {activeCount} {activeCount === 1 ? "compra recorrente ativa" : "compras recorrentes ativas"}</p></div>
            <span className="finance-estimate-tag">Meses do calendário</span>
          </section>
          <section className="finance-months" aria-label="Resumo financeiro estimado por mês">
            {projection.months.map((month, index) => (
              <article className={"panel finance-month-card" + (month.key === selectedMonth.key ? " is-selected" : "")} aria-label={"Estimativa de " + month.label + " de " + month.year} key={month.key}>
                <button className="finance-month-select" type="button" aria-label={"Ver " + month.label + " de " + month.year} aria-pressed={month.key === selectedMonth.key} aria-controls="finance-month-breakdown" onClick={() => { setMonthKey(month.key); setShowAll(false); }}>
                  <span className="finance-month-label"><CalendarDays size={20} />{month.label}<small>{month.year}{index === 0 ? " · Mês atual" : ""}</small></span>
                  <strong>{moneyCents(month.totalCents)}</strong><span>Gasto estimado no mês</span>
                </button>
                <dl className="finance-month-values"><div><dt>Produtos estimados</dt><dd>{moneyCents(month.productsCents)}</dd></div><div><dt>Fretes estimados</dt><dd>{moneyCents(month.freightCents)}</dd></div></dl>
                <p>{month.count} {month.count === 1 ? "entrega prevista" : "entregas previstas"} · {dateLabel(month.start)} a {dateLabel(addDays(month.end, -1))}</p>
              </article>
            ))}
          </section>
          <p className="finance-method">Selecione um mês para ver suas próximas cobranças e o detalhamento. Os totais somam as entregas da agenda dentro de cada mês, incluindo as datas já transcorridas no mês atual. Somente compras recorrentes ativas entram na estimativa; pausadas e canceladas ficam fora.</p>

          <section className="panel finance-section" aria-labelledby="upcoming-finance-title">
            <div className="finance-section-heading"><h2 id="upcoming-finance-title">Próximas cobranças estimadas</h2><span>{monthName}</span></div>
            <p className="finance-method">Esta lista mostra apenas as próximas datas do mês selecionado. As datas são referências das entregas previstas. A cobrança ocorre antes de cada ciclo; a data exata será confirmada. Preços e fretes podem variar.</p>
            {monthCharges.length ? (
              <>
                <ol className="finance-charges">
                  {visibleCharges.map((charge) => (
                    <li key={charge.subscriptionId + charge.frequency + charge.date} className="finance-charge">
                      <div className="finance-charge-date"><CalendarDays size={18} /><span>Entrega de referência<strong>{dateLabel(charge.date)}</strong></span></div>
                      <div className="finance-charge-info"><Link href={"/minhas-assinaturas/" + charge.subscriptionId}>{charge.name} · #{charge.subscriptionId}</Link><p>{charge.frequency}</p>{charge.paymentPending && <p className="finance-payment-warning">Pagamento a regularizar</p>}</div>
                      <dl className="finance-charge-values"><div><dt>Produtos estimados</dt><dd>{moneyCents(charge.productsCents)}</dd></div><div><dt>Frete estimado</dt><dd>{moneyCents(charge.freightCents)}</dd></div><div><dt>Total estimado</dt><dd>{moneyCents(charge.totalCents)}</dd></div></dl>
                    </li>
                  ))}
                </ol>
                {monthCharges.length > 8 && <button className="btn secondary finance-show-more" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "Mostrar menos cobranças" : "Ver todas as " + monthCharges.length + " cobranças estimadas"}</button>}
              </>
            ) : <div className="finance-empty"><CalendarDays size={28} /><h3>Nenhuma próxima cobrança prevista em {monthName}</h3><p>Consulte os demais meses nos quadros acima. As compras pausadas e canceladas continuam disponíveis abaixo para consulta.</p></div>}
          </section>

          <section className="finance-breakdown" id="finance-month-breakdown" aria-labelledby="finance-breakdown-title">
            <div className="finance-section-heading"><h2 id="finance-breakdown-title">Detalhamento por compra recorrente</h2><span>Valores estimados · {monthName}</span></div>
            {projection.rows.length ? projection.rows.map((row) => {
              const costs = row.months[selectedMonthIndex];
              return (
              <article className="panel finance-subscription" aria-label={"Estimativa da compra recorrente #" + row.subscription.id} key={row.subscription.id}>
                <header><div><Link href={"/minhas-assinaturas/" + row.subscription.id}>{row.subscription.name} · #{row.subscription.id}<ArrowRight size={16} /></Link><p>{[...new Set(row.subscription.items.map((item) => item.frequency))].join(" · ")}</p></div><Badge status={row.subscription.status} /></header>
                {row.subscription.status !== "Ativa" ? <p className="finance-excluded">{row.subscription.status === "Pausada" ? "Pausada: fora da projeção enquanto os recebimentos estiverem pausados." : "Cancelada: sem novas cobranças e fora da projeção."}</p> : <p className="finance-next-date">{costs.firstDate ? "Primeira entrega prevista no mês: " + dateLabel(costs.firstDate) : "Nenhuma entrega prevista para este mês."}{row.subscription.paymentStatus === "Recusado" && <span className="finance-payment-warning"> · Pagamento a regularizar</span>}</p>}
                <dl className="finance-subscription-values"><div><dt>Entregas previstas no mês</dt><dd>{costs.count}</dd></div><div><dt>Produtos estimados</dt><dd>{moneyCents(costs.productsCents)}</dd></div><div><dt>Fretes estimados</dt><dd>{moneyCents(costs.freightCents)}</dd></div><div><dt>Total estimado do mês</dt><dd>{moneyCents(costs.totalCents)}</dd></div></dl>
                <p className="finance-variable-note">Estimativa com preços e fretes variáveis a cada ciclo.</p>
              </article>
            ); }) : <div className="panel finance-empty"><Wallet size={28} /><h3>Suas estimativas aparecerão aqui</h3><p>Crie uma compra recorrente para acompanhar os gastos previstos. Os valores serão estimados e sujeitos a variação.</p><Link className="btn primary" href="/assinatura/configurar">Criar compra recorrente <ArrowRight size={16} /></Link></div>}
          </section>

          <details className="panel finance-method-details"><summary>Como calculamos estas estimativas?</summary><p>Mostramos o mês atual e os dois seguintes, do primeiro ao último dia de cada mês. As entregas são calculadas a partir da data cadastrada e agrupadas pelo mês em que estão previstas. O mês atual inclui as ocorrências da agenda em datas já transcorridas; a lista de próximas cobranças mostra somente datas a partir de hoje. Isso não comprova entregas ou pagamentos realizados.</p><p>Cada entrega soma produtos e um frete estimado de {moneyCents(ESTIMATED_FREIGHT_CENTS)}. As frequências continuam Semanal (7 dias), Quinzenal (14 dias) e Mensal (30 dias). Uma entrega pulada fica fora da estimativa daquela ocorrência.</p><p>Compras pausadas e canceladas não são incluídas. A compra de hoje também fica fora deste painel. Preços, fretes, disponibilidade e datas exatas de cobrança serão confirmados a cada ciclo.</p></details>
        </>
      )}
    </main>
  );
}
