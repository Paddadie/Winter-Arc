import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { StatBlock } from "./StatBlock";
import { WeightHistoryChart } from "./WeightHistoryChart";
import { DayDetailCard } from "./DayDetailCard";
import { getActiveGoal } from "../../db/goalRepo";
import { getAllWeightEntries } from "../../db/weightRepo";
import { getDailyLogsBetween } from "../../db/dailyLogRepo";
import { buildWeightSeries, type WeightSeriesPoint } from "../../domain/weightSeries";
import { todayISO } from "../../utils/date";
import type { WeightEntry, WeightGoal, DailyLog } from "../../db/schema";
import "./WeightHistoryPage.css";

export function WeightHistoryPage() {
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [g, allEntries] = await Promise.all([getActiveGoal(), getAllWeightEntries()]);
      const rangeStart = earliestDate(g, allEntries);
      const rangeEnd = todayISO();
      const logs = await getDailyLogsBetween(rangeStart, rangeEnd);
      setGoal(g);
      setEntries(allEntries);
      setDailyLogs(logs);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Historique" accentColor="var(--color-coral)" backTo="/regime" backLabel="Régime">
        <p className="text-muted">Chargement…</p>
      </PageLayout>
    );
  }

  const rangeStart = earliestDate(goal, entries);
  const rangeEnd = todayISO();
  const series = buildWeightSeries(entries, goal, rangeStart, rangeEnd, dailyLogs);
  const selectedPoint = selectedDate ? series.find((p) => p.date === selectedDate) ?? null : null;
  const [visStart, visEnd] = visibleRange ?? [0, series.length - 1];

  return (
    <PageLayout title="Historique" accentColor="var(--color-coral)" backTo="/regime" backLabel="Régime">
      <WeightHistoryChart
        series={series}
        hasGoal={goal !== null}
        onSelectDate={setSelectedDate}
        onVisibleRangeChange={(start, end) => setVisibleRange([start, end])}
      />

      <PeriodStats series={series.slice(visStart, visEnd + 1)} />

      {selectedPoint && <DayDetailCard point={selectedPoint} onClose={() => setSelectedDate(null)} />}
    </PageLayout>
  );
}

/** Début de la fenêtre affichée : le plus ancien entre le début de l'objectif et la première pesée. */
function earliestDate(goal: WeightGoal | null, entries: WeightEntry[]): string {
  const candidates = [goal?.startDate, entries[0]?.date].filter((d): d is string => d != null);
  if (candidates.length === 0) return todayISO();
  return candidates.reduce((min, d) => (d < min ? d : min));
}

function PeriodStats({ series }: { series: WeightSeriesPoint[] }) {
  const realPoints = series.filter((p): p is WeightSeriesPoint & { weightKg: number } => p.weightKg !== null);

  if (realPoints.length === 0 || series.length === 0) {
    return (
      <Card>
        <p className="empty-message">Aucune donnée de poids sur la période affichée.</p>
      </Card>
    );
  }

  const startWeight = realPoints[0].weightKg;
  const endWeight = realPoints[realPoints.length - 1].weightKg;
  const variation = Math.round((endWeight - startWeight) * 10) / 10;
  const minWeight = Math.min(...realPoints.map((p) => p.weightKg));
  const maxWeight = Math.max(...realPoints.map((p) => p.weightKg));

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
          value={`${variation > 0 ? "+" : ""}${variation.toFixed(1).replace(".", ",")} kg`}
          variant={variation > 0 ? "alert" : "success"}
        />
        <StatBlock label="Min – Max" value={`${formatKg(minWeight)} – ${formatKg(maxWeight)}`} />
      </div>
    </Card>
  );
}

function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace(".", ",")} kg`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}