import type { Frequency } from "@/types";
import { addDays, dateLabel } from "./utils";
import { monthlyCycle } from "./monthly-cycle";

const weekdays = [
  "Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira",
  "Quinta-Feira", "Sexta-Feira", "Sábado",
];

export function cycleSchedule(frequency: Frequency, date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const weekday = weekdays[day];
  if (frequency === "Toda semana") {
    const every = day === 0 || day === 6 ? "todo" : "toda";
    return `Você receberá a sua compra ${every} ${weekday}.`;
  }
  if (frequency === "A cada 2 semanas") {
    return `Você receberá a sua primeira compra em ${dateLabel(date)}. E as próximas a cada 2 semanas, sempre no mesmo dia da semana (${weekday}). Próximo ciclo: ${dateLabel(addDays(date, 14))} (2 semanas).`;
  }
  if (frequency === "Todo mês") {
    const cycle = monthlyCycle(date);
    const ordinal = ["primeira", "segunda", "terceira", "quarta", "quinta"][cycle.occurrence - 1];
    const fallback = cycle.occurrence === 5
      ? " Nos meses sem a quinta ocorrência, você receberá na última ocorrência desse dia da semana."
      : "";
    return `Você receberá a sua primeira compra em ${dateLabel(date)}. E as próximas toda ${ordinal} semana do mês (${weekday}). Próximo ciclo: ${dateLabel(cycle.nextDate)} (${cycle.weeks} semanas).${fallback}`;
  }
  const cadence: Record<Exclude<Frequency, "Toda semana" | "Todo mês" | "A cada 2 semanas">, string> = {
    "A cada 2 meses": "a cada 2 meses",
  };
  return `Você receberá a sua compra ${cadence[frequency]}, a partir de ${weekday} (${dateLabel(date)}).`;
}
