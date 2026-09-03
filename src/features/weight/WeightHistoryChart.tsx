import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Brush,
} from "recharts";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { todayISO, formatDayMonth } from "../../utils/date";
import { WeightDot, Legend, DayHighlights, TrendLine } from "./weightChartCommon";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./WeightHistoryChart.css";

interface WeightHistoryChartProps {
  series: WeightSeriesPoint[];
  hasGoal: boolean;
  onSelectDate: (date: string) => void;
  /** Prévient le parent de la plage actuellement visible (zoomée via le Brush), pour les statistiques. */
  onVisibleRangeChange: (startIndex: number, endIndex: number) => void;
}

/**
 * Graphique de l'historique complet, avec zoom/déplacement via le Brush
 * natif de Recharts (glisser les poignées en bas) plutôt qu'un sélecteur
 * de période fixe : on reste sur un composant déjà fourni par la lib déjà
 * utilisée dans le projet, sans ajouter de dépendance ni de geste tactile
 * personnalisé à maintenir.
 */
export function WeightHistoryChart({ series, hasGoal, onSelectDate, onVisibleRangeChange }: WeightHistoryChartProps) {
  const [brushRange, setBrushRange] = useState<[number, number]>([0, series.length - 1]);
  const hasAnyWeight = series.some((p) => p.weightKg !== null);
  const hasTrend = series.some((p) => p.trendWeightKg !== null);

  // Intervalle de ticks adapté à la longueur de la série, pour garder
  // un axe lisible que l'historique couvre quelques semaines ou un an.
  const tickInterval = Math.max(0, Math.ceil(series.length / 7) - 1);

  function handleBrushChange(range: { startIndex?: number; endIndex?: number }) {
    const start = range.startIndex ?? 0;
    const end = range.endIndex ?? series.length - 1;
    setBrushRange([start, end]);
    onVisibleRangeChange(start, end);
  }

  function resetZoom() {
    setBrushRange([0, series.length - 1]);
    onVisibleRangeChange(0, series.length - 1);
  }

  const isZoomed = brushRange[0] > 0 || brushRange[1] < series.length - 1;

  if (!hasAnyWeight) {
    return (
      <Card>
        <p className="empty-message">Aucune pesée enregistrée pour le moment.</p>
      </Card>
    );
  }

  return (
    <Card className="card--flat">
      <div className="weight-history-header">
        <CardLabel className="card-label--flush">Historique</CardLabel>
        {isZoomed && (
          <button onClick={resetZoom} className="weight-history-reset-button">
            Réinitialiser le zoom
          </button>
        )}
      </div>

      <div className="weight-history-canvas">
        <ResponsiveContainer>
          <ComposedChart
            data={series}
            margin={{ top: 20, right: 16, bottom: 14, left: 0 }}
            barCategoryGap={0}
          >
            <DayHighlights series={series} showPeriod={isPeriodTrackingEnabled()} />
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayMonth}
              interval={tickInterval}
              padding={{ left: 12, right: 12 }}
              tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <ReferenceLine x={todayISO()} stroke="var(--color-ink-muted)" strokeDasharray="3 3" />

            {hasGoal && (
              <Line
                type="monotone"
                dataKey="goalWeightKg"
                stroke="var(--color-depth)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}

            {hasTrend && <TrendLine />}

            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="var(--color-coral)"
              strokeWidth={2.5}
              dot={<WeightDot onSelect={onSelectDate} />}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />

            <Brush
              dataKey="date"
              height={24}
              stroke="var(--color-coral)"
              fill="var(--color-coral-soft)"
              travellerWidth={10}
              tickFormatter={formatDayMonth}
              startIndex={brushRange[0]}
              endIndex={brushRange[1]}
              onChange={handleBrushChange}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Legend hasGoal={hasGoal} hasTrend={hasTrend} showPeriod={isPeriodTrackingEnabled()} />
    </Card>
  );
}