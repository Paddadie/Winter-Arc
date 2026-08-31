import type { ApneaSession } from "../db/schema";

/** Formate une durée en secondes au format "MM:SS" (ex: 135 → "02:15"). */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Formate une durée en millisecondes au format "MM:SS:cc", pour le chrono en direct. */
export function formatDurationWithMs(totalMs: number): string {
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centis = Math.floor((totalMs % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(centis).padStart(2, "0")}`;
}

export interface ApneaDailyPoint {
  date: string;
  durationSec: number;
  count: number;
}

/**
 * Regroupe des sessions par jour et retient la meilleure performance de
 * chaque jour (plus pertinent qu'une moyenne : une séance ratée un jour où
 * tu as par ailleurs bien performé ne doit pas tirer le point vers le bas).
 * `sessions` doit être trié par date croissante en entrée : les jours
 * ressortent alors dans le même ordre, sans tri supplémentaire.
 */
export function groupDailyBest(sessions: ApneaSession[]): ApneaDailyPoint[] {
  const byDate = new Map<string, number[]>();
  for (const s of sessions) {
    const durations = byDate.get(s.date) ?? [];
    durations.push(s.durationSec);
    byDate.set(s.date, durations);
  }
  return [...byDate.entries()].map(([date, durations]) => ({
    date,
    durationSec: Math.max(...durations),
    count: durations.length,
  }));
}

export interface ApneaWindowStats {
  averageSec: number;
  worst: { durationSec: number; date: string };
  best: { durationSec: number; date: string };
}

/**
 * Moyenne, pire et meilleure performance (avec leur date) sur un ensemble de
 * sessions, ou null si vide. Moyenne calculée sur TOUTES les séances brutes
 * de la période (pas de regroupement par jour) — comportement volontairement
 * conservé tel quel.
 */
export function computeWindowStats(sessions: ApneaSession[]): ApneaWindowStats | null {
  if (sessions.length === 0) return null;

  const worst = sessions.reduce((min, s) => (s.durationSec < min.durationSec ? s : min));
  const best = sessions.reduce((max, s) => (s.durationSec > max.durationSec ? s : max));
  const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);

  return {
    averageSec: Math.round(totalSec / sessions.length),
    worst: { durationSec: worst.durationSec, date: worst.date },
    best: { durationSec: best.durationSec, date: best.date },
  };
}
