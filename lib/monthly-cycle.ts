// Preserve the weekday and its occurrence in the month. When the next month
// has no fifth occurrence, use its last occurrence of that weekday.
export function monthlyCycle(date: string, intervalMonths: 1 | 2 = 1) {
  const selected = new Date(`${date}T12:00:00Z`);
  const occurrence = Math.ceil(selected.getUTCDate() / 7);
  const next = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + intervalMonths, 1, 12));
  const offset = (selected.getUTCDay() - next.getUTCDay() + 7) % 7;
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  let day = 1 + offset + (occurrence - 1) * 7;
  const usesLastOccurrence = day > lastDay;
  if (usesLastOccurrence) day -= 7;
  next.setUTCDate(day);
  return {
    occurrence,
    nextDate: next.toISOString().slice(0, 10),
    weeks: (next.getTime() - selected.getTime()) / (7 * 24 * 60 * 60 * 1000),
    usesLastOccurrence,
  };
}
