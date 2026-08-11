import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { QuickWeightEntry } from "./QuickWeightEntry";
import { GoalForm } from "./GoalForm";
import { WeightSummaryCard } from "./WeightSummaryCard";
import { WeightChart } from "./WeightChart";
import { getActiveGoal } from "../../db/goalRepo";
import { getAllWeightEntries, getLatestWeightEntry } from "../../db/weightRepo";
import { buildWeightSeries } from "../../domain/weightSeries";
import { todayISO, addDays } from "../../utils/date";
import type { WeightEntry, WeightGoal } from "../../db/schema";

export function WeightPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [latestEntry, setLatestEntry] = useState<WeightEntry | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [g, all, latest] = await Promise.all([
      getActiveGoal(),
      getAllWeightEntries(),
      getLatestWeightEntry(),
    ]);
    setGoal(g);
    setEntries(all);
    setLatestEntry(latest);
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

  const windowStart = addDays(todayISO(), -15);
  const windowEnd = addDays(todayISO(), 15);
  const series = buildWeightSeries(entries, goal, windowStart, windowEnd);

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

      <WeightChart series={series} hasGoal={goal !== null} />
    </PageLayout>
  );
}
