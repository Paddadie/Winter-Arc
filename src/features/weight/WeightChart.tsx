import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { todayISO, formatDayMonth } from "../../utils/date";
import { WeightDot, ChartTooltip, Legend, DayHighlights, TrendLine } from "./weightChartCommon";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./WeightChart.css";

interface WeightChartProps {
  series: WeightSeriesPoint[];
  hasGoal: boolean;
  onSelectDate: (date: string) => void;
}

export function WeightChart({ series, hasGoal, onSelectDate }: WeightChartProps) {
  const navigate = useNavigate();
  const hasAnyWeight = series.some((p) => p.weightKg !== null);
  const hasTrend = series.some((p) => p.trendWeightKg !== null);
  // Dernier poids connu (réel ou estimé) : sert d'ancre pour une échelle Y
  // resserrée autour de la valeur actuelle plutôt qu'un dataMin/dataMax
  // auto-calculé, qui peut produire des graduations à virgule difficiles à
  // lire sur un axe étroit.
  const referenceWeight = [...series].reverse().find((p) => p.weightKg !== null)?.weightKg ?? null;
  const yDomain: [number | string, number | string] =
    referenceWeight !== null ? [referenceWeight - 1.5, referenceWeight + 3] : ["dataMin - 1", "dataMax + 1"];

  return (
    <Card className="card--flat">
      <CardLabel className="card-label--chart">Évolution récente</CardLabel>

      {!hasAnyWeight ? (
        <p className="empty-message empty-message--spacious">Enregistre quelques pesées pour voir le graphique apparaître.</p>
      ) : (
        <div className="weight-chart-canvas">
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
                interval={4}
                padding={{ left: 12, right: 12 }}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
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
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <Legend hasGoal={hasGoal} hasTrend={hasTrend} showPeriod={isPeriodTrackingEnabled()} />

      <button onClick={() => navigate("/regime/historique")} className="weight-chart-history-link">
        Historique →
      </button>
    </Card>
  );
}