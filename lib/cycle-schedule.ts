import type { Frequency } from "@/types";
import { addDays, dateLabel } from "./utils";

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
    return `Você receberá a sua primeira compra em ${dateLabel(date)}. E as próximas a cada 2 semanas, sempre no mesmo dia da semana (${weekday}).`;
  }
  const intervalDays = frequency === "Todo mês" ? 30 : 60;
  return `Você receberá a sua primeira compra em ${dateLabel(date)}.\n\nO próximo ciclo está pré-agendado para ${dateLabel(addDays(date, intervalDays))}.`;
}
