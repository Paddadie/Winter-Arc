import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { LoadStatusMessage, type LoadStatus } from "../../components/LoadStatusMessage";
import { DayEntryCard } from "./DayEntryCard";
import { GoalForm } from "./GoalForm";
import { WeightSummaryCard } from "./WeightSummaryCard";
import { WeightChart } from "./WeightChart";
import { DayDetailCard } from "./DayDetailCard";
import { getActiveGoal } from "../../db/goalRepo";
import { getAllWeightEntries, getLatestWeightEntry } from "../../db/weightRepo";
import { backfillPastDailyLogs, getDailyLogsBetween } from "../../db/dailyLogRepo";
import { buildWeightSeries } from "../../domain/weightSeries";
import { todayISO, addDays } from "../../utils/date";
import { trackingStartDate } from "./trackingStart";
import { useRefreshOnForeground } from "../../utils/useRefreshOnForeground";
import type { WeightEntry, WeightGoal, DailyLog } from "../../db/schema";
import "./WeightPage.css";

/**
 * Fenêtre du graphique "Évolution récente" : les deux dernières semaines, et
 * trois jours d'avance sur la trajectoire — assez pour lire où mène
 * l'objectif, sans une bande de futur vide qui écrase le passé utile.
 */
const WINDOW_DAYS_BEFORE = 14;
const WINDOW_DAYS_AFTER = 3;

export function WeightPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [latestEntry, setLatestEntry] = useState<WeightEntry | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  // Fenêtre recalculée à chaque rendu plutôt qu'une fois pour toutes au
  // chargement du module : une PWA installée peut rester des jours en
  // mémoire, la fenêtre doit suivre le changement de date.
  const windowStart = addDays(todayISO(), -WINDOW_DAYS_BEFORE);
  const windowEnd = addDays(todayISO(), WINDOW_DAYS_AFTER);

  async function refresh(): Promise<WeightGoal | null> {
    const [activeGoal, allEntries, latest] = await Promise.all([
      getActiveGoal(),
      getAllWeightEntries(),
      getLatestWeightEntry(),
    ]);
    // Matérialise les journaux des jours passés restés vides AVANT de les
    // lire : un jour révolu sans saisie vaut "ni sport ni écart", et cette
    // vérité doit être en base, pas seulement à l'écran.
    await backfillPastDailyLogs(trackingStartDate(activeGoal, allEntries), addDays(todayISO(), -1));
    const logs = await getDailyLogsBetween(windowStart, windowEnd);
    setGoal(activeGoal);
    setEntries(allEntries);
    setLatestEntry(latest);
    setDailyLogs(logs);
    setStatus("ready");
    return activeGoal;
  }

  useEffect(() => {
    refresh()
      .then((activeGoal) => {
        // Premier lancement : aucun objectif encore défini, on ouvre le formulaire
        // pour guider l'utilisateur. Ensuite, l'édition se fait via le bouton d'en-tête.
        if (!activeGoal) setShowGoalForm(true);
      })
      .catch(() => setStatus("error"));
  }, []);

  useRefreshOnForeground(() => {
    refresh().catch(() => setStatus("error"));
  });

  const series = buildWeightSeries(entries, goal, windowStart, windowEnd, dailyLogs);
  // Index plutôt que find : les jours voisins servent de bornes au balayage
  // de la fiche du jour, qui ne sort jamais de la fenêtre affichée.
  const selectedIndex = selectedDate ? series.findIndex((p) => p.date === selectedDate) : -1;
  const selectedPoint = selectedIndex >= 0 ? series[selectedIndex] : null;

  return (
    <PageLayout
      title="Régime"
      accentColor="var(--color-coral)"
      headerAction={
        status === "ready" && (
          <button onClick={() => setShowGoalForm(true)} aria-label="Modifier l'objectif" className="weight-goal-button">
            🎯
          </button>
        )
      }
    >
      {status !== "ready" ? (
        <LoadStatusMessage status={status} />
      ) : (
        <>
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

          {selectedPoint && (
            <DayDetailCard
              point={selectedPoint}
              onClose={() => setSelectedDate(null)}
              onChanged={refresh}
              previousDate={series[selectedIndex - 1]?.date ?? null}
              nextDate={series[selectedIndex + 1]?.date ?? null}
              onNavigate={setSelectedDate}
            />
          )}
        </>
      )}
    </PageLayout>
  );
}
