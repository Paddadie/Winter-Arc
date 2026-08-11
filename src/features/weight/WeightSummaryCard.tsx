import { Card } from "../../components/Card";
import { todayISO } from "../../utils/date";
import { remainingKg, daysRemaining } from "../../domain/weightTrajectory";
import type { WeightEntry, WeightGoal } from "../../db/schema";

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
      <p style={{ margin: 0, fontSize: "13px", color: "var(--color-ink-muted)", fontWeight: 600 }}>
        Dernier poids
      </p>
      <p
        style={{
          margin: "2px 0 0 0",
          fontFamily: "var(--font-display)",
          fontSize: "40px",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {latestEntry ? formatKg(latestEntry.weightKg) : "—"}
      </p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-ink-muted)" }}>
        {latestEntry ? formatRelativeDate(latestEntry.date) : "Aucune pesée enregistrée"}
      </p>

      {goal ? (
        <div
          style={{
            marginTop: "var(--space-m)",
            paddingTop: "var(--space-m)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <SummaryStat label="Objectif" value={formatKg(goal.targetWeightKg)} />
          <SummaryStat
            label="Restant"
            value={
              remaining !== null ? `${remaining > 0 ? "-" : "+"}${Math.abs(remaining).toFixed(1)} kg` : "—"
            }
          />
          <SummaryStat label="Échéance" value={daysLeft !== null && daysLeft >= 0 ? `${daysLeft} j` : "dépassée"} />
        </div>
      ) : (
        <p
          style={{
            marginTop: "var(--space-m)",
            paddingTop: "var(--space-m)",
            borderTop: "1px solid var(--color-border)",
            fontSize: "13px",
            color: "var(--color-ink-muted)",
          }}
        >
          Aucun objectif défini — utilise le bouton 🎯 en haut pour en créer un.
        </p>
      )}
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-ink-muted)", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace(".", ",")} kg`;
}

function formatRelativeDate(iso: string): string {
  if (iso === todayISO()) return "Aujourd'hui";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
