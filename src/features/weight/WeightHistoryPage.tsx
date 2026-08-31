import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { LoadStatusMessage, type LoadStatus } from "../../components/LoadStatusMessage";
import { Card } from "../../components/Card";
import { StatBlock } from "./StatBlock";
import { WeightHistoryChart } from "./WeightHistoryChart";
import { DayDetailCard } from "./DayDetailCard";
import { getActiveGoal } from "../../db/goalRepo";
import { getAllWeightEntries } from "../../db/weightRepo";
import { getDailyLogsBetween } from "../../db/dailyLogRepo";
import { buildWeightSeries, type WeightSeriesPoint } from "../../domain/weightSeries";
import { todayISO, parseISODate } from "../../utils/date";
import { useRefreshOnForeground } from "../../utils/useRefreshOnForeground";
import { formatKg, formatSignedKg } from "./weightFormat";
import type { WeightEntry, WeightGoal, DailyLog } from "../../db/schema";
import "./WeightHistoryPage.css";

export function WeightHistoryPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  async function refresh() {
    const [activeGoal, allEntries] = await Promise.all([getActiveGoal(), getAllWeightEntries()]);
    const logs = await getDailyLogsBetween(earliestDate(activeGoal, allEntries), todayISO());
    setGoal(activeGoal);
    setEntries(allEntries);
    setDailyLogs(logs);
    setStatus("ready");
  }

  useEffect(() => {
    refresh().catch(() => setStatus("error"));
  }, []);

  useRefreshOnForeground(() => {
    refresh().catch(() => setStatus("error"));
  });

  const rangeStart = earliestDate(goal, entries);
  const rangeEnd = todayISO();
  const series = buildWeightSeries(entries, goal, rangeStart, rangeEnd, dailyLogs);
  const selectedPoint = selectedDate ? series.find((p) => p.date === selectedDate) ?? null : null;
  const [visStart, visEnd] = visibleRange ?? [0, series.length - 1];

  return (
    <PageLayout title="Historique" accentColor="var(--color-coral)" backTo="/regime" backLabel="Régime">
      {status !== "ready" ? (
        <LoadStatusMessage status={status} />
      ) : (
        <>
          <WeightHistoryChart
            series={series}
            hasGoal={goal !== null}
            onSelectDate={setSelectedDate}
            onVisibleRangeChange={(start, end) => setVisibleRange([start, end])}
          />

          <PeriodStats series={series.slice(visStart, visEnd + 1)} />

          {selectedPoint && (
            <DayDetailCard point={selectedPoint} onClose={() => setSelectedDate(null)} onChanged={refresh} />
          )}
        </>
      )}
    </PageLayout>
  );
}

/** Début de la fenêtre affichée : le plus ancien entre le début de l'objectif et la première pesée. */
function earliestDate(goal: WeightGoal | null, entries: WeightEntry[]): string {
  const candidates = [goal?.startDate, entries[0]?.date].filter((d): d is string => d != null);
  if (candidates.length === 0) return todayISO();
  return candidates.reduce((min, d) => (d < min ? d : min));
}

/**
 * Statistiques de la plage actuellement visible dans le graphique (zoom du
 * Brush). Les jours interpolés comptent comme des jours de la plage : ils
 * sont dessinés dans la courbe, les exclure donnerait des bornes début/fin
 * incohérentes avec ce que l'utilisateur voit.
 */
function PeriodStats({ series }: { series: WeightSeriesPoint[] }) {
  const pointsWithWeight = series.filter((p): p is WeightSeriesPoint & { weightKg: number } => p.weightKg !== null);

  if (pointsWithWeight.length === 0) {
    return (
      <Card>
        <p className="empty-message">Aucune donnée de poids sur la période affichée.</p>
      </Card>
    );
  }

  const startWeight = pointsWithWeight[0].weightKg;
  const endWeight = pointsWithWeight[pointsWithWeight.length - 1].weightKg;
  const variation = Math.round((endWeight - startWeight) * 10) / 10;
  const weights = pointsWithWeight.map((p) => p.weightKg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  return (
    <Card>
      <p className="period-stats-subtitle">
        Du {formatShortDate(series[0].date)} au {formatShortDate(series[series.length - 1].date)}
      </p>
      <div className="period-stats-grid">
        <StatBlock label="Début" value={formatKg(startWeight)} />
        <StatBlock label="Fin" value={formatKg(endWeight)} />
        <StatBlock
          label="Variation"
          value={formatSignedKg(variation)}
          variant={variation > 0 ? "alert" : "success"}
        />
        <StatBlock label="Min – Max" value={`${formatKg(minWeight)} – ${formatKg(maxWeight)}`} />
      </div>
    </Card>
  );
}

function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}