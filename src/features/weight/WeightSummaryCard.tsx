import { Card } from "../../components/Card";
import { StatBlock } from "./StatBlock";
import { todayISO, relativeDayLabel } from "../../utils/date";
import { remainingKg, daysRemaining } from "../../domain/weightTrajectory";
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
 */
export function WeightSummaryCard({ latestEntry, goal }: WeightSummaryCardProps) {
  const remaining = goal && latestEntry ? remainingKg(goal, latestEntry.weightKg) : null;
  const daysLeft = goal ? daysRemaining(goal, todayISO()) : null;

  return (
    <Card>
      <p className="weight-summary-label">Dernier poids</p>
      <p className="weight-summary-value">{latestEntry ? formatKg(latestEntry.weightKg) : "—"}</p>
      <p className="weight-summary-date">
        {latestEntry ? relativeDayLabel(latestEntry.date) : "Aucune pesée enregistrée"}
      </p>

      {goal ? (
        <div className="weight-summary-goal-row">
          <StatBlock label="Objectif" value={formatKg(goal.targetWeightKg)} />
          <StatBlock
            label="Restant"
            value={remaining !== null ? `${remaining > 0 ? "-" : "+"}${Math.abs(remaining).toFixed(1)} kg` : "—"}
          />
          <StatBlock label="Échéance" value={daysLeft !== null && daysLeft >= 0 ? `${daysLeft} j` : "dépassée"} />
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