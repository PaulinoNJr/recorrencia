import type { Frequency } from "@/types";
import { dateLabel } from "./utils";

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
  const cadence: Record<Exclude<Frequency, "Toda semana">, string> = {
    "A cada 15 dias": "a cada 15 dias",
    "Todo mês": "todo mês",
    "A cada 2 meses": "a cada 2 meses",
  };
  return `Você receberá a sua compra ${cadence[frequency]}, a partir de ${weekday} (${dateLabel(date)}).`;
}
