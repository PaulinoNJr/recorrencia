import type { Metadata } from "next";
import { RecurringFinance } from "@/components/recurring-finance";

export const metadata: Metadata = {
  title: "Financeiro | Compras recorrentes | Covabra",
  description: "Estimativas de gastos, fretes e próximas cobranças das suas compras recorrentes. Valores sujeitos a variação.",
};

export default function Page() {
  return <RecurringFinance />;
}
