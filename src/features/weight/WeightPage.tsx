import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { DayEntryCard } from "./DayEntryCard";
import { GoalForm } from "./GoalForm";
import { WeightSummaryCard } from "./WeightSummaryCard";
import { WeightChart } from "./WeightChart";
import { DayDetailCard } from "./DayDetailCard";
import { getActiveGoal } from "../../db/goalRepo";
import { getAllWeightEntries, getLatestWeightEntry } from "../../db/weightRepo";
import { getDailyLogsBetween } from "../../db/dailyLogRepo";
import { buildWeightSeries } from "../../domain/weightSeries";
import { todayISO, addDays } from "../../utils/date";
import type { WeightEntry, WeightGoal, DailyLog } from "../../db/schema";
import "./WeightPage.css";

const WINDOW_START = addDays(todayISO(), -15);
const WINDOW_END = addDays(todayISO(), 5);

export function WeightPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [latestEntry, setLatestEntry] = useState<WeightEntry | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [g, all, latest, logs] = await Promise.all([
      getActiveGoal(),
      getAllWeightEntries(),
      getLatestWeightEntry(),
      getDailyLogsBetween(WINDOW_START, WINDOW_END),
    ]);
    setGoal(g);
    setEntries(all);
    setLatestEntry(latest);
    setDailyLogs(logs);
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
        <p className="text-muted">Chargement…</p>
      </PageLayout>
    );
  }

  const series = buildWeightSeries(entries, goal, WINDOW_START, WINDOW_END, dailyLogs);
  const selectedPoint = selectedDate ? series.find((p) => p.date === selectedDate) ?? null : null;

  return (
    <PageLayout
      title="Régime"
      accentColor="var(--color-coral)"
      headerAction={
        <button onClick={() => setShowGoalForm(true)} aria-label="Modifier l'objectif" className="weight-goal-button">
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

      <DayEntryCard entries={entries} onSaved={refresh} />

      <WeightChart series={series} hasGoal={goal !== null} onSelectDate={setSelectedDate} />

      {selectedPoint && <DayDetailCard point={selectedPoint} onClose={() => setSelectedDate(null)} />}
    </PageLayout>
  );
}
