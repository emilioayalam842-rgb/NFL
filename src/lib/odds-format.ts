export function formatAmericanOdds(odds: number | null | undefined): string {
  if (odds == null) return "—";
  return odds > 0 ? `+${odds}` : `${odds}`;
}
