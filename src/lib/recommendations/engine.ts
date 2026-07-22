// Heuristic statistical model for betting recommendations.
//
// This is intentionally simple (rolling averages + a logistic squashing
// function) rather than a "real" predictive model — it's meant to surface a
// data-backed lean, not a guaranteed outcome. Confidence is capped well
// short of 1.0 on purpose: nothing here should read as a sure thing.

export interface TeamForm {
  avgPointsFor: number;
  avgPointsAgainst: number;
  gamesPlayed: number;
}

const MIN_CONFIDENCE = 0.52;
const MAX_CONFIDENCE = 0.78;

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function clampConfidence(raw: number) {
  return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, raw));
}

export function teamForm(games: { pointsFor: number; pointsAgainst: number }[]): TeamForm {
  if (games.length === 0) return { avgPointsFor: 21, avgPointsAgainst: 21, gamesPlayed: 0 };
  const avgPointsFor = games.reduce((s, g) => s + g.pointsFor, 0) / games.length;
  const avgPointsAgainst = games.reduce((s, g) => s + g.pointsAgainst, 0) / games.length;
  return { avgPointsFor, avgPointsAgainst, gamesPlayed: games.length };
}

export interface PickResult {
  pick: string;
  confidence: number;
  rationale: string;
}

const HOME_FIELD_ADVANTAGE = 1.5; // points

export function recommendSpread(
  homeTeamName: string,
  awayTeamName: string,
  home: TeamForm,
  away: TeamForm,
  marketSpread: number // negative favors home, e.g. -3.5 means home favored by 3.5
): PickResult {
  const homeProjected = home.avgPointsFor - away.avgPointsAgainst + HOME_FIELD_ADVANTAGE;
  const awayProjected = away.avgPointsFor - home.avgPointsAgainst;
  const projectedMargin = homeProjected - awayProjected; // positive = home wins by this much

  const edge = projectedMargin - -marketSpread; // how far the model's margin beats the line
  const confidence = clampConfidence(0.5 + sigmoid(edge / 7) - 0.5);

  const favorsHome = edge >= 0;
  const team = favorsHome ? homeTeamName : awayTeamName;
  const line = favorsHome ? marketSpread : -marketSpread;
  const sign = line <= 0 ? "" : "+";

  return {
    pick: `${team} ${sign}${line}`,
    confidence,
    rationale: `Margen proyectado ${projectedMargin >= 0 ? "+" : ""}${projectedMargin.toFixed(
      1
    )} para el local vs. línea de mercado ${marketSpread}, basado en promedio de puntos anotados/permitidos en juegos recientes.`,
  };
}

export function recommendMoneyline(
  homeTeamName: string,
  awayTeamName: string,
  home: TeamForm,
  away: TeamForm
): PickResult {
  const homeProjected = home.avgPointsFor - away.avgPointsAgainst + HOME_FIELD_ADVANTAGE;
  const awayProjected = away.avgPointsFor - home.avgPointsAgainst;
  const projectedMargin = homeProjected - awayProjected;

  const winProb = sigmoid(projectedMargin / 6);
  const favorsHome = winProb >= 0.5;
  const confidence = clampConfidence(favorsHome ? winProb : 1 - winProb);

  return {
    pick: favorsHome ? homeTeamName : awayTeamName,
    confidence,
    rationale: `Probabilidad de victoria estimada ${(confidence * 100).toFixed(
      0
    )}% para ${favorsHome ? homeTeamName : awayTeamName} según forma reciente y ventaja de local.`,
  };
}

export function recommendTotal(home: TeamForm, away: TeamForm, marketTotal: number): PickResult {
  const projectedTotal =
    home.avgPointsFor + away.avgPointsFor + (home.avgPointsAgainst + away.avgPointsAgainst) / 2;
  const edge = projectedTotal - marketTotal;
  const confidence = clampConfidence(0.5 + Math.abs(sigmoid(edge / 6) - 0.5));
  const over = edge >= 0;

  return {
    pick: `${over ? "Over" : "Under"} ${marketTotal}`,
    confidence,
    rationale: `Total proyectado ${projectedTotal.toFixed(1)} pts vs. línea de mercado ${marketTotal}, con base en el promedio ofensivo/defensivo combinado de ambos equipos.`,
  };
}

export function recommendPlayerProp(
  playerName: string,
  statLabel: string,
  recentValues: number[],
  line: number
): PickResult | null {
  if (recentValues.length < 2) return null;

  const avg = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
  const variance =
    recentValues.reduce((s, v) => s + (v - avg) ** 2, 0) / recentValues.length;
  const stdDev = Math.sqrt(variance) || 1;

  const zScore = (avg - line) / stdDev;
  const confidence = clampConfidence(0.5 + Math.abs(sigmoid(zScore) - 0.5));
  const over = avg >= line;

  return {
    pick: `${playerName} ${over ? "Over" : "Under"} ${line} ${statLabel}`,
    confidence,
    rationale: `Promedio de ${avg.toFixed(1)} en sus últimos ${recentValues.length} juegos vs. línea de ${line}.`,
  };
}
