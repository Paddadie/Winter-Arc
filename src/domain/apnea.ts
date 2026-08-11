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

/** Moyenne (arrondie à la seconde) d'une liste de durées, ou null si vide. */
export function averageDuration(durationsSec: number[]): number | null {
  if (durationsSec.length === 0) return null;
  const total = durationsSec.reduce((sum, d) => sum + d, 0);
  return Math.round(total / durationsSec.length);
}

export interface ApneaWindowStats {
  averageSec: number;
  worst: { durationSec: number; date: string };
  best: { durationSec: number; date: string };
}

/** Moyenne, pire et meilleure performance (avec leur date) sur un ensemble de sessions, ou null si vide. */
export function computeWindowStats(sessions: ApneaSession[]): ApneaWindowStats | null {
  if (sessions.length === 0) return null;
  const worst = sessions.reduce((min, s) => (s.durationSec < min.durationSec ? s : min));
  const best = sessions.reduce((max, s) => (s.durationSec > max.durationSec ? s : max));
  return {
    averageSec: averageDuration(sessions.map((s) => s.durationSec))!,
    worst: { durationSec: worst.durationSec, date: worst.date },
    best: { durationSec: best.durationSec, date: best.date },
  };
}