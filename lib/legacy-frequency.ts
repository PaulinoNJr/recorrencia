import type { Frequency } from "@/types";

// These aliases are read only to recover sessions saved by earlier versions.
const legacyFrequencies = new Map<string, Frequency>([
  ["Toda semana", "Semanal"],
  ["A cada 2 semanas", "Quinzenal"],
  ["A cada 15 dias", "Quinzenal"],
  ["Todo mês", "Mensal"],
  ["A cada 2 meses", "Mensal"],
  ["A cada dois meses", "Mensal"],
  ["Bimestral", "Mensal"],
]);

export function normalizeLegacyFrequency(value?: string): Frequency | undefined {
  if (value === "Semanal" || value === "Quinzenal" || value === "Mensal") return value;
  return value ? legacyFrequencies.get(value) : undefined;
}

export function migrateLegacyFrequency(key: string, value: unknown): unknown {
  if (key === "frequency" && typeof value === "string") return normalizeLegacyFrequency(value) ?? value;
  if (key === "cycleDeliveries" && value && typeof value === "object" && !Array.isArray(value)) {
    const priority = (label: string) => label === normalizeLegacyFrequency(label) ? 3 : label === "Todo mês" ? 2 : 1;
    return Object.fromEntries(Object.entries(value)
      .sort(([a], [b]) => priority(a) - priority(b))
      .map(([label, delivery]) => [normalizeLegacyFrequency(label) ?? label, delivery]));
  }
  if (key === "name" && typeof value === "string") {
    for (const [legacy, frequency] of legacyFrequencies) {
      const suffix = " · " + legacy;
      if (value.endsWith(suffix)) return value.slice(0, -suffix.length) + " · " + frequency;
    }
  }
  return value;
}
