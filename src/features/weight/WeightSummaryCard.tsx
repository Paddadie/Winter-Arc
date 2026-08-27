import { Card } from "../../components/Card";
import { StatBlock } from "./StatBlock";
import { todayISO, relativeDayLabel, formatDurationLabel } from "../../utils/date";
import { remainingKg, daysRemaining, theoreticalWeightAt } from "../../domain/weightTrajectory";
import type { WeightEntry, WeightGoal } from "../../db/schema";
import "./WeightSummaryCard.css";

interface WeightSummaryCardProps {
  latestEntry: WeightEntry | null;
  goal: WeightGoal | null;
}

/**
 * Affiche toujours le dernier poids (même sans objectif défini), et affiche
 * les stats d'objectif seulement si un objectif actif existe. La saisie du
 * poids doit rester utile même avant d'avoir défini un objectif.
 *
 * "Écart objectif" est une distance (toujours positive) jusqu'à l'objectif
 * final. "Écart trajectoire" compare le dernier poids connu au poids
 * théorique du jour même (pas l'objectif final) : négatif si en dessous de
 * la trajectoire prévue (en avance), positif si au-dessus (en retard).
 */
export function WeightSummaryCard({ latestEntry, goal }: WeightSummaryCardProps) {
  const remaining = goal && latestEntry ? remainingKg(goal, latestEntry.weightKg) : null;
  const daysLeft = goal ? daysRemaining(goal, todayISO()) : null;
  const trajectoryDiff =
    goal && latestEntry
      ? Math.round((latestEntry.weightKg - theoreticalWeightAt(goal, todayISO())) * 10) / 10
      : null;

  return (
    <Card>
      <p className="weight-summary-label">Dernier poids</p>
      <p className="weight-summary-value">{latestEntry ? formatKg(latestEntry.weightKg) : "—"}</p>
      <p className="weight-summary-date">
        {latestEntry ? relativeDayLabel(latestEntry.date) : "Aucune pesée enregistrée"}
      </p>

      {goal ? (
        <div className="weight-summary-stats-grid">
          <StatBlock
            label="Écart trajectoire"
            value={trajectoryDiff !== null ? `${trajectoryDiff > 0 ? "+" : ""}${formatKg(trajectoryDiff)}` : "—"}
            variant={trajectoryDiff === null ? undefined : trajectoryDiff > 0 ? "alert" : "success"}
          />
          <StatBlock label="Écart objectif" value={remaining !== null ? formatKg(Math.abs(remaining)) : "—"} />
          <StatBlock label="Objectif" value={formatKg(goal.targetWeightKg)} />
          <StatBlock
            label="Échéance"
            value={daysLeft !== null && daysLeft >= 0 ? formatDurationLabel(todayISO(), goal.targetDate) : "dépassée"}
          />
        </div>
      ) : (
        <p className="weight-summary-empty">Aucun objectif défini — utilise le bouton 🎯 en haut pour en créer un.</p>
      )}
    </Card>
  );
}

function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace(".", ",")} kg`;
}
