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
import { todayISO } from "../../utils/date";
import { WeightDot, ChartTooltip, Legend, formatTick } from "./weightChartCommon";
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

  function handleChartClick(state: { activeLabel?: string | number } | null) {
    if (state?.activeLabel != null) onSelectDate(String(state.activeLabel));
  }

  return (
    <Card className="card--flat">
      <CardLabel className="card-label--chart">Évolution récente</CardLabel>

      {!hasAnyWeight ? (
        <p className="weight-chart-empty">Enregistre quelques pesées pour voir le graphique apparaître.</p>
      ) : (
        <div className="weight-chart-canvas">
          <ResponsiveContainer>
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 12, bottom: 22, left: -12 }}
              onClick={handleChartClick}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                interval={4}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={34}
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

              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--color-coral)"
                strokeWidth={2.5}
                dot={<WeightDot />}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <Legend hasGoal={hasGoal} />

      <button onClick={() => navigate("/regime/historique")} className="weight-chart-history-link">
        Historique →
      </button>
    </Card>
  );
}