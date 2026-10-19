// Recover existing sessions without losing selected dates, products or history.
export function migrateLegacyFrequency(key: string, value: unknown): unknown {
  if (key === "frequency" && value === "A cada 15 dias") return "A cada 2 semanas";
  if (value && typeof value === "object" && Object.hasOwn(value, "A cada 15 dias")) {
    const { ["A cada 15 dias"]: legacy, ...rest } = value as Record<string, unknown>;
    return { ...rest, "A cada 2 semanas": rest["A cada 2 semanas"] ?? legacy };
  }
  return value;
}
