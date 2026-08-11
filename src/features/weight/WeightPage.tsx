import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { QuickWeightEntry } from "./QuickWeightEntry";
import { GoalForm } from "./GoalForm";
import { WeightSummaryCard } from "./WeightSummaryCard";
import { getActiveGoal } from "../../db/goalRepo";
import { getLatestWeightEntry } from "../../db/weightRepo";
import type { WeightEntry, WeightGoal } from "../../db/schema";

export function WeightPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [latestEntry, setLatestEntry] = useState<WeightEntry | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [g, w] = await Promise.all([getActiveGoal(), getLatestWeightEntry()]);
    setGoal(g);
    setLatestEntry(w);
    setLoading(false);
    return g;
  }

  useEffect(() => {
    refresh().then((g) => {
      // Premier lancement : aucun objectif encore défini, on ouvre le formulaire
      // pour guider l'utilisateur. Ensuite, l'édition se fait via le bouton d'en-tête.
      if (!g) setShowGoalForm(true);
    });
  }, []);

  if (loading) {
    return (
      <PageLayout title="Régime" accentColor="var(--color-coral)">
        <p style={{ color: "var(--color-ink-muted)" }}>Chargement…</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Régime"
      accentColor="var(--color-coral)"
      headerAction={
        <button
          onClick={() => setShowGoalForm(true)}
          aria-label="Modifier l'objectif"
          style={{
            border: "none",
            background: "var(--color-coral-soft)",
            color: "var(--color-coral)",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🎯
        </button>
      }
    >
      {showGoalForm && (
        <GoalForm
          currentGoal={goal}
          latestWeightKg={latestEntry?.weightKg ?? null}
          onSaved={async () => {
            setShowGoalForm(false);
            await refresh();
          }}
          onCancel={() => setShowGoalForm(false)}
        />
      )}

      <WeightSummaryCard latestEntry={latestEntry} goal={goal} />

      <QuickWeightEntry onSaved={refresh} />

      <div
        style={{
          padding: "var(--space-m)",
          borderRadius: "var(--radius-m)",
          background: "var(--color-teal-soft)",
          fontSize: "13px",
          color: "var(--color-depth)",
        }}
      >
        Le graphique d'évolution arrive à l'étape suivante.
      </div>
    </PageLayout>
  );
}
